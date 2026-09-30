import { randomUUID } from 'node:crypto'
import type {
	IncomingMessage,
	OutgoingMessage,
	Server,
	ServerResponse
} from 'node:http'
import { createServer } from 'node:http'
import { assertExists } from '@shared/asserts.ts'
import { toNodeHandler } from 'better-auth/node'
import { GraphQLError, type GraphQLSchema, printSchema } from 'graphql'
import { createYoga } from 'graphql-yoga'
import { inject, injectable, optional } from 'inversify'
import { Kysely } from 'kysely'
import { Authenticator } from 'src/auth.ts'
import type { DB } from 'src/database/schema.ts'
import { hashApiKey } from '../security/api-key.ts'
import { queryLimits } from '../security/query-limits.ts'
import { log } from '../utils/log.ts'
import { Health } from './health.ts'
import { ImageService } from './image-service.ts'
import { MediaAssets } from './media-assets.ts'
import { SchemaService } from './schema-service.ts'

@injectable()
export class PublicServer {
	private schemaCache = new Map<
		string,
		{ revisionId: number; schema: GraphQLSchema }
	>()

	@inject(MediaAssets) private assets: MediaAssets
	@inject(Kysely)
	private db: Kysely<DB>

	@inject(SchemaService)
	private schemaService: SchemaService

	@inject(ImageService)
	private imageService: ImageService

	@inject(Authenticator)
	private auth: Authenticator

	@inject(Health) @optional() private health: Health | undefined
	private server: Server | undefined

	async schema(apiKey: string): Promise<GraphQLSchema> {
		const { project_id, preview, published_revision_id, version, last_used } =
			await this.db
				.selectFrom('api_key')
				.innerJoin('project', 'project.id', 'api_key.project_id')
				.select([
					'project_id',
					'preview',
					'published_revision_id',
					'version',
					'last_used'
				])
				.where('key', '=', hashApiKey(apiKey))
				.where('is_active', '=', true)
				.where(eb =>
					eb.or([
						eb('expires_at', 'is', null),
						eb('expires_at', '>', new Date())
					])
				)
				.executeTakeFirstOrThrow()
		const revisionId = preview
			? (
					await this.db
						.selectFrom('content_revision')
						.select('id')
						.where('project_id', '=', project_id)
						.where('version', '=', version)
						.executeTakeFirst()
				)?.id
			: published_revision_id
		if (!revisionId)
			throw new GraphQLError('This project has no published content', {
				extensions: { code: 'PUBLICATION_REQUIRED' }
			})
		if (!last_used || last_used.getTime() < Date.now() - 60000)
			await this.db
				.updateTable('api_key')
				.set({ last_used: new Date() })
				.where('key', '=', hashApiKey(apiKey))
				.execute()
		const key = `${project_id}:${preview ? 'preview' : 'published'}`
		const cached = this.schemaCache.get(key)
		if (cached?.revisionId === revisionId) return cached.schema
		const schema = await this.schemaService.getRevisionSchema(
			project_id,
			revisionId
		)
		this.schemaCache.set(key, { revisionId, schema })
		if (this.schemaCache.size > 128) {
			const oldest = this.schemaCache.keys().next().value
			if (oldest !== undefined) this.schemaCache.delete(oldest)
		}
		return schema
	}

	private async generateSchema(req: IncomingMessage, res: ServerResponse) {
		const apiKey = req.headers['x-api-key'] as string | undefined
		assertExists(apiKey, 'API key is required')
		const schema = await this.schema(apiKey)
		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.end(printSchema(schema))
	}

	public async start() {
		const yoga = createYoga<{
			req: IncomingMessage
			reply: OutgoingMessage
		}>({
			schema: ({ request }) => {
				const apiKey = request.headers.get('x-api-key')
				assertExists(apiKey, 'API key is required')
				return this.schema(apiKey)
			},
			graphiql: false,
			plugins: [
				{
					onParams({ params }) {
						if ((params.query?.length ?? 0) > 16384)
							throw new GraphQLError('Query is too large')
					},
					onValidate({
						addValidationRule
					}: {
						addValidationRule: (rule: typeof queryLimits) => void
					}) {
						addValidationRule(queryLimits)
					}
				}
			],
			maskedErrors: true
		})

		const auth = toNodeHandler(this.auth)
		const server = createServer((req, res) => {
			const requestId = randomUUID()
			const started = Date.now()
			res.setHeader('X-Request-ID', requestId)
			res.setHeader('X-Content-Type-Options', 'nosniff')
			const path = new URL(req.url ?? '/', 'http://localhost').pathname
			res.once('finish', () =>
				log('http_request', {
					requestId,
					method: req.method,
					route: path.startsWith('/media/')
						? '/media'
						: path.startsWith('/api/auth/')
							? '/api/auth'
							: path,
					status: res.statusCode,
					durationMs: Date.now() - started
				})
			)
			const handle = async () => {
				if (path === '/health/live' || path === '/health/ready') {
					const ready = path === '/health/live' || (await this.health?.ready())
					res.writeHead(ready ? 200 : 503, {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store'
					})
					res.end(JSON.stringify({ status: ready ? 'ok' : 'unavailable' }))
					return
				}
				if (Number(req.headers['content-length'] ?? 0) > 65536) {
					res.writeHead(413)
					res.end('Request too large')
					return
				}
				if (path.startsWith('/api/auth/')) return auth(req, res)
				if (path.startsWith('/media/asset/'))
					return this.assets.handleRequest(req, res)
				if (path.startsWith('/media/'))
					return this.imageService.handleRequest(req, res)
				if (path === '/schema') {
					try {
						await this.generateSchema(req, res)
					} catch {
						res.writeHead(403)
						res.end('Forbidden')
					}
					return
				}
				if (path === '/graphql') return yoga(req, res)
				res.writeHead(404)
				res.end('Not found')
			}
			void handle().catch(() => {
				log('http_request_failed', { requestId })
				if (!res.headersSent) res.writeHead(500)
				res.end('Request failed')
			})
		})
		server.requestTimeout = 30000
		server.headersTimeout = 15000
		this.server = server
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject)
			server.listen(Number(process.env.PUBLIC_PORT ?? 4001), resolve)
		})
		log('public_listening', { port: Number(process.env.PUBLIC_PORT ?? 4001) })
	}

	public async stop() {
		const server = this.server
		if (!server) return
		await new Promise<void>((resolve, reject) =>
			server.close(error => (error ? reject(error) : resolve()))
		)
		this.server = undefined
	}
}
