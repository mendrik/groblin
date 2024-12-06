import 'reflect-metadata'
import 'dotenv/config'
import { createServer } from 'node:http'
import { makeExecutableSchema } from '@graphql-tools/schema'
import {} from 'ansicolor'
import { execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { createYoga } from 'graphql-yoga'
import { WebSocketServer } from 'ws'
import { context } from './context.ts'
import { initializeEmailService } from './emails/email-service.ts'
import { onConnect } from './middleware/on-connect.ts'
import { onError } from './middleware/on-errors.ts'
import { schema as gqlSchema } from './schema-builder.ts'

const schema = makeExecutableSchema({ typeDefs: gqlSchema })

const yogaApp = createYoga({
	graphiql: {
		subscriptionsProtocol: 'WS'
	}
})

const httpServer = createServer(yogaApp)

const wsServer = new WebSocketServer({
	server: httpServer,
	path: yogaApp.graphqlEndpoint
})

useServer({ schema, execute, subscribe, context, onConnect, onError }, wsServer)

initializeEmailService()

httpServer.listen(6173, () => {
	console.log(`Server is running on port 6153 ${yogaApp.graphqlEndpoint}`)
})
