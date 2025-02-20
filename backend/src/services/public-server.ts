import type { IncomingMessage, OutgoingMessage, Server } from 'node:http'
import { createServer } from 'node:http'
import { assertExists } from '@shared/asserts.ts'
import { cyan, lightGreen, yellow } from 'ansicolor'
import type { GraphQLSchema } from 'graphql'
import { createYoga } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { T as _, startsWith } from 'ramda'

// This is the fastify instance you have created

import { caseOf, match } from '@shared/utils/match.ts'
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

	private abort: AbortController

	private server: Server

	constructor() {
		const yoga = createYoga<{
			req: IncomingMessage
			reply: OutgoingMessage
		}>({
			schema: ({ request }) => this.schema(request)
		})

		this.server = createServer(
			match<[any, any], any>(
				caseOf([{ url: startsWith('/image/') }, _], (i, o) =>
					this.imageService.handleRequest(i, o)
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
