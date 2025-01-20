import {
	type IncomingMessage,
	type Server,
	type ServerResponse,
	createServer
} from 'node:http'
import { type YogaInitialContext, createSchema, createYoga } from 'graphql-yoga'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { PubSub } from 'type-graphql'
import type { DB } from './database/schema.ts'

const port = 4001

@injectable()
export class PublicServer {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	private server: Server<typeof IncomingMessage, typeof ServerResponse>

	constructor() {
		const yoga = createYoga({
			schema: ({ request }) => this.schema(request)
		})
		this.server = createServer(yoga)
	}

	private async schema(request: YogaInitialContext['request']) {
		return createSchema({
			typeDefs: /* GraphQL */ `
                type Query {
                    greetings: String!
                }
            `,
			resolvers: {
				Query: {
					greetings: () => 'Hello World!'
				}
			}
		})
	}

	public start() {
		this.server.listen(port, () => {
			console.info(`Server is running on http://localhost:${port}/graphql`)
		})
	}

	public stop() {
		this.server.close()
	}
}
