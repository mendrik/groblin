import 'dotenv/config'
import 'reflect-metadata'
import { readFileSync } from 'node:fs'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'
import { context } from './database.ts'

const typeDefs = readFileSync('../schema.graphql', 'utf8')
const schema = makeExecutableSchema({ typeDefs })

const server = new WebSocketServer({
	port: 6173,
	path: '/graphql'
})

useServer({ schema, execute, subscribe, context }, server)

console.log('Listening to port 6173')
