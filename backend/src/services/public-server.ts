import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { assertExists } from '@shared/asserts.ts'
import { cyan, lightGreen, yellow } from 'ansicolor'
import fastify, {
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest
} from 'fastify'
import type { GraphQLSchema } from 'graphql'
import { createYoga } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'

// This is the fastify instance you have created

import type { DB } from 'src/database/schema.ts'
import { Topic } from 'src/types.ts'
import type { ProjectId } from 'src/types.ts'
import type { PubSub } from 'type-graphql'
import { PublicService } from './public-service.ts'

const port = 4001

@injectable()
export class PublicServer {
	private schemaCache: Map<ProjectId, GraphQLSchema> = new Map()

	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(PublicService)
	private schemaService: PublicService

	private server: Server<typeof IncomingMessage, typeof ServerResponse>

	private abort: AbortController
	private app: FastifyInstance

	constructor() {
		const yoga = createYoga<{
			req: FastifyRequest
			reply: FastifyReply
		}>({
			schema: ({ request }) => this.schema(request)
		})
		this.app = fastify({ logger: true })
		this.app.get('/image', async (req, reply) => {
			reply.send('Hello World')
		})
		this.app.route({
			url: yoga.graphqlEndpoint,
			method: ['GET', 'POST', 'OPTIONS'],
			handler: async (req: FastifyRequest, reply: FastifyReply) => {
				const response = await yoga.handleNodeRequestAndResponse(req, reply, {
					req,
					reply
				})
				response.headers.forEach((value, key) => reply.header(key, value))
				reply.status(response.status)
				reply.send(response.body)
				return reply
			}
		})
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
			Topic.NodeSettingsUpdated
		) as AsyncGenerator<ProjectId>) {
			this.schemaCache.delete(projectId)
			console.log(yellow(`Reloading schema for project ${projectId}`))
			if (this.abort.signal.aborted) break
		}
	}

	private async schema(request: Request): Promise<GraphQLSchema> {
		const apiKey = request.headers.get('x-api-key')
		assertExists(apiKey, 'API key is required')
		const { project_id } = await this.db
			.selectFrom('api_key')
			.select('project_id')
			.where('key', '=', apiKey)
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

	public start() {
		this.listenToNodeChanges()
		this.listenToNodeSettingsChanges()
		this.app.listen({ port }).then(() => {
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
