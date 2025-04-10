import type {
	IncomingMessage,
	OutgoingMessage,
	Server,
	ServerResponse
} from 'node:http'
import { createServer } from 'node:http'
import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import { assertExists } from '@shared/asserts.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { cyan, lightGreen, yellow } from 'ansicolor'
import { toNodeHandler } from 'better-auth/node'
import { type GraphQLSchema, printSchema } from 'graphql'
import { createYoga } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { T as _, equals, startsWith } from 'ramda'
import { Authenticator } from 'src/auth.ts'
import type { DB } from 'src/database/schema.ts'
import type { ProjectId } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import type { PubSub } from 'type-graphql'
import { ImageService } from './image-service.ts'
import { PublicService } from './public-service.ts'

const port = process.env.PUBLIC_PORT

@injectable()
export class PublicServer {
	private schemaCache: Map<ProjectId, GraphQLSchema> = new Map()

	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(PublicService)
	private schemaService: PublicService

	@inject(ImageService)
	private imageService: ImageService

	@inject(Authenticator)
	private auth: Authenticator

	private abort: AbortController

	private server: Server

	constructor() {
		const yoga = createYoga<{
			req: IncomingMessage
			reply: OutgoingMessage
		}>({
			schema: ({ request }) => {
				const apiKey = request.headers.get('x-api-key')
				assertExists(apiKey, 'API key is required')
				return this.schema(apiKey)
			},
			renderGraphiQL
		})

		this.server = createServer(
			match<[any, any], any>(
				caseOf([{ url: startsWith('/api/auth/') }, _], (i, o) =>
					toNodeHandler(this.auth)(i, o)
				),
				caseOf([{ url: startsWith('/media/') }, _], (i, o) =>
					this.imageService.handleRequest(i, o)
				),
				caseOf([{ url: equals('/schema') }, _], (i, o) =>
					this.generateSchema(i, o)
				),
				caseOf([_, _], yoga)
			)
		)
		this.abort = new AbortController()
	}

	private async listenToNodeChanges() {
		for await (const projectId of this.pubSub.subscribe(
			Topic.NodesUpdated
		) as AsyncGenerator<ProjectId>) {
			this.schemaCache.delete(projectId)
			console.log(yellow(`Reloading schema for project ${projectId}`))
			if (this.abort.signal.aborted) break
		}
	}

	private async listenToNodeSettingsChanges() {
		for await (const projectId of this.pubSub.subscribe(
			Topic.SomeNodeSettingsUpdated
		) as AsyncGenerator<ProjectId>) {
			this.schemaCache.delete(projectId)
			console.log(yellow(`Reloading schema for project ${projectId}`))
			if (this.abort.signal.aborted) break
		}
	}

	async schema(apiKey: string): Promise<GraphQLSchema> {
		const { project_id } = await this.db
			.selectFrom('api_key')
			.select('project_id')
			.where('key', '=', apiKey)
			.where('is_active', '=', true)
			.executeTakeFirstOrThrow()
		const cache = this.schemaCache
		if (!cache.has(project_id)) {
			const schema = await this.schemaService.getSchema(project_id)
			cache.set(project_id, schema)
		}
		const res = cache.get(project_id)
		assertExists(res, 'Schema not found')
		return res
	}

	private async generateSchema(req: IncomingMessage, res: ServerResponse) {
		const apiKey = req.headers['x-api-key'] as string | undefined
		assertExists(apiKey, 'API key is required')
		const schema = await this.schema(apiKey)
		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.end(printSchema(schema))
	}

	public start() {
		this.listenToNodeChanges()
		this.listenToNodeSettingsChanges()
		this.server.listen({ port }, () => {
			console.log(
				cyan(
					`Public GQL server on http://localhost:${lightGreen(port)}/graphql`
				)
			)
		})
	}

	public stop() {
		this.abort.abort()
		this.server.close()
	}
}
