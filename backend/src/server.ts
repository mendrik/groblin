import 'dotenv/config'
import 'reflect-metadata'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'
import { context } from './database.ts'
import { schema as gqlSchema } from './schema-builder.ts'

const schema = makeExecutableSchema({ typeDefs: gqlSchema })

const server = new WebSocketServer({
	port: 6173,
	path: '/graphql'
})

useServer({ schema, execute, subscribe, context }, server)

console.log('Listening to port 6173')
