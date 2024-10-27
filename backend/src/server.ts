import 'reflect-metadata'
import { useServer } from 'graphql-ws/lib/use/ws'
import { Query, buildSchema } from 'type-graphql'
import { WebSocketServer } from 'ws'

// Define your GraphQL resolvers
class HelloResolver {
	@Query(() => String)
	async hello() {
		return 'Hello, world!'
	}
}

// Build the TypeGraphQL schema
const schema = await buildSchema({
	resolvers: [HelloResolver]
})

const server = new WebSocketServer({
	port: 4000,
	path: '/graphql'
})

useServer({ schema }, server)

console.log('Listening to port 4000')
