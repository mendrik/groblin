import { cyan, lightGreen } from 'ansicolor'
import 'dotenv/config'
import { execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/use/ws'
import { injectable } from 'inversify'
import { prop } from 'ramda'
import { type PubSub, buildSchema } from 'type-graphql'
import 'reflect-metadata'
import { container } from 'src/injections.ts'
import { AuthChecker } from 'src/middleware/auth-checker.ts'
import { ApiKeyResolver } from 'src/resolvers/api-key-resolver.ts'
import { AuthResolver } from 'src/resolvers/auth-resolver.ts'
import { IoResolver } from 'src/resolvers/io-resolver.ts'
import { ListResolver } from 'src/resolvers/list-resolver.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import { NodeSettingsResolver } from 'src/resolvers/node-settings-resolver.ts'
import { ProjectResolver } from 'src/resolvers/project-resolver.ts'
import { UserResolver } from 'src/resolvers/user-resolver.ts'
import { ValueResolver } from 'src/resolvers/value-resolver.ts'
import { WebSocketServer } from 'ws'
import type { Schema } from 'zod'
import { onConnect } from '../middleware/on-connect.ts'
import { onError } from '../middleware/on-errors.ts'

const port = Number.parseInt(process.env.PORT ?? '6173')

@injectable()
export class InternalServer {
	private server: WebSocketServer
	private schema: Schema

	constructor() {
		this.server = new WebSocketServer({
			port,
			path: '/graphql'
		})
	}

	public async start() {
		const schema = await buildSchema({
			resolvers: [
				AuthResolver,
				ProjectResolver,
				NodeResolver,
				NodeSettingsResolver,
				ValueResolver,
				IoResolver,
				ListResolver,
				ApiKeyResolver,
				UserResolver
			],
			pubSub: container.get<PubSub>('PubSub'),
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
				onConnect,
				onError
			},
			this.server
		)
		console.log(cyan(`Started server on ${lightGreen(port)}`))
	}

	public stop() {
		this.server.close()
	}
}
