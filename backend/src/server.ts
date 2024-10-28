import 'dotenv/config'
import 'reflect-metadata'
import { writeFileSync } from 'node:fs'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type { AnyFn } from '@tp/functions.ts'
import fg from 'fast-glob'
import { execute, printSchema, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { type NonEmptyArray, flatten, map, values } from 'ramda'
import { allP } from 'ramda-adjunct'
import { buildSchema } from 'type-graphql'
import { WebSocketServer } from 'ws'
import { context } from './database.ts'

const resolvers: NonEmptyArray<AnyFn> = await fg('./src/resolvers/**/*.ts')
	.then(
		map<string, any>(file =>
			import(file.replace('./src/', 'src/')).then(values)
		)
	)
	.then(allP)
	.then<any>(flatten)

console.log('Loaded resolvers:', ...resolvers)

// Build the TypeGraphQL schema
const schema = await buildSchema({ resolvers })
// Write to a file
writeFileSync('../schema.graphql', printSchema(schema), {
	encoding: 'utf-8'
})
const executableSchema = makeExecutableSchema({ typeDefs: schema })

const server = new WebSocketServer({
	port: 6173,
	path: '/graphql'
})

useServer({ schema, execute, subscribe, context }, server)

console.log('Listening to port 6173')
