import { cyan, lightGreen } from 'ansicolor'
import 'dotenv/config'
import { useServer } from 'graphql-ws/use/ws'
import { type Container, injectable } from 'inversify'
import { prop } from 'ramda'
import 'reflect-metadata'
import { execute, subscribe } from 'graphql'
import { AuthChecker } from 'src/middleware/auth-checker.ts'
import { ApiKeyResolver } from 'src/resolvers/api-key-resolver.ts'
import { IoResolver } from 'src/resolvers/io-resolver.ts'
import { ListResolver } from 'src/resolvers/list-resolver.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from 'src/resolvers/node-settings-resolver.ts'
import { ProjectResolver } from 'src/resolvers/project-resolver.ts'
import { UserResolver } from 'src/resolvers/user-resolver.ts'
import { ValueResolver } from 'src/resolvers/value-resolver.ts'
import { buildSchema } from 'type-graphql'
import { WebSocketServer } from 'ws'
import { onConnect as connectFactory } from '../middleware/on-connect.ts'
import { onError } from '../middleware/on-errors.ts'

const port = Number.parseInt(process.env.PORT ?? '6173')

@injectable()
export class InternalServer {
	private server: WebSocketServer

	constructor() {
		this.server = new WebSocketServer({
			port,
			path: '/graphql'
		})
	}

	public async start(container: Container) {
		const schema = await buildSchema({
			resolvers: [
				ProjectResolver,
				NodeResolver,
				NodeSettingsResolver,
				ValueResolver,
				IoResolver,
				ListResolver,
				ApiKeyResolver,
				UserResolver
			],
			pubSub: container.get('PubSub'),
			authChecker: AuthChecker,
			container,
			emitSchemaFile: '../schema.graphql',
			authMode: 'null'
		})

		useServer(
			{
				schema,
				execute,
				subscribe,
				context: prop('extra'),
				onConnect: connectFactory(container),
				onError
			},
			this.server
		)
		console.log(cyan(`Internal GQL server on ${lightGreen(port)}`))
	}

	public stop() {
		this.server.close()
	}
}
