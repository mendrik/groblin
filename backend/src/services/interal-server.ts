import { useServer } from 'graphql-ws/use/ws'
import { type Container, injectable } from 'inversify'
import 'reflect-metadata'
import {
	execute,
	GraphQLError,
	specifiedRules,
	subscribe,
	validate
} from 'graphql'
import { WebSocketServer } from 'ws'
import { onConnect as connectFactory } from '../middleware/on-connect.ts'
import { onError } from '../middleware/on-errors.ts'
import { queryLimits } from '../security/query-limits.ts'
import { log } from '../utils/log.ts'
import { buildInternalSchema } from './internal-schema.ts'

@injectable()
export class InternalServer {
	private server: WebSocketServer | undefined
	private dispose: (() => Promise<void>) | undefined
	public async start(container: Container) {
		if (this.server) throw new Error('Internal server already started')
		const schema = buildInternalSchema(container)
		const server = new WebSocketServer({
			port: Number(process.env.PORT ?? 6173),
			path: '/graphql',
			maxPayload: 64 * 1024,
			verifyClient: ({ origin }: { origin: string }) =>
				(process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173')
					.split(',')
					.includes(origin)
		})
		this.server = server
		const cleanup = useServer(
			{
				schema,
				onSubscribe: ctx =>
					Object.keys(ctx.subscriptions).length > 32
						? [new GraphQLError('Too many concurrent operations')]
						: undefined,
				execute,
				subscribe,
				validate: (schema, document) =>
					validate(schema, document, [...specifiedRules, queryLimits]),
				context: async (ctx, _id, payload) => {
					await connectFactory(container, payload.extensions?.projectId)(ctx)
					return { ...ctx.extra }
				},
				onConnect: connectFactory(container),
				onError
			},
			server
		)
		this.dispose = async () => {
			await cleanup.dispose()
		}
		await new Promise<void>((resolve, reject) => {
			server.once('listening', resolve)
			server.once('error', reject)
		})
		log('internal_listening', { port: Number(process.env.PORT ?? 6173) })
	}
	public async stop() {
		await this.dispose?.()
		this.server = undefined
	}
}
