import {
	type IncomingMessage,
	type Server,
	type ServerResponse,
	createServer
} from 'node:http'
import { assertExists } from '@shared/asserts.ts'
import { cyan, lightGreen, yellow } from 'ansicolor'
import {
	type GraphQLSchemaWithContext,
	type YogaInitialContext,
	createYoga
} from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import { Topic } from 'src/types.ts'
import type { ProjectId } from 'src/types.ts'
import type { PubSub } from 'type-graphql'
import { SchemaService } from './schema-service.ts'

const port = 4001

@injectable()
export class PublicServer {
	private schemaCache: Map<
		ProjectId,
		GraphQLSchemaWithContext<YogaInitialContext>
	> = new Map()

	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(SchemaService)
	private schemaService: SchemaService

	private server: Server<typeof IncomingMessage, typeof ServerResponse>

	private abort: AbortController

	constructor() {
		const yoga = createYoga({
			schema: ({ request }) => this.schema(request)
		})
		this.server = createServer(yoga)
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
			Topic.NodesUpdated
		) as AsyncGenerator<ProjectId>) {
			this.schemaCache.delete(projectId)
			console.log(yellow(`Reloading schema for project ${projectId}`))
			if (this.abort.signal.aborted) break
		}
	}

	private async schema(
		request: YogaInitialContext['request']
	): Promise<GraphQLSchemaWithContext<YogaInitialContext>> {
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
		this.server.listen(port, () => {
			console.log(cyan(`Public GQL server on ${lightGreen(port)}`))
		})
	}

	public stop() {
		this.abort.abort()
		this.server.close()
	}
}
