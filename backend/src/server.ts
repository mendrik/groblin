import 'reflect-metadata'
import type { AnyFn } from '@types/functions'
import fg from 'fast-glob'
import { useServer } from 'graphql-ws/lib/use/ws'
import { type NonEmptyArray, flatten, map, values } from 'ramda'
import { allP } from 'ramda-adjunct'
import { buildSchema } from 'type-graphql'
import { WebSocketServer } from 'ws'

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

const server = new WebSocketServer({
	port: 4000,
	path: '/graphql'
})

useServer({ schema }, server)

console.log('Listening to port 4000')
