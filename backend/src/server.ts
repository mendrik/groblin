import 'dotenv/config'
import 'reflect-metadata'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { type ExecutionArgs, execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { call } from 'ramda'
import { WebSocketServer } from 'ws'
import { context } from './database.ts'
import { schema as gqlSchema } from './schema-builder.ts'

const schema = makeExecutableSchema({ typeDefs: gqlSchema })

const server = new WebSocketServer({
	port: 6173,
	path: '/graphql'
})

const WhiteSpace = /\{(.|\n)*?\}/gim

// Custom execute function to add logging
const loggingExecute = async (args: ExecutionArgs) => {
	const { document, variableValues, contextValue } = args

	// Log the operation (query/mutation) and variables
	console.log(
		'GraphQL Request:',
		document.loc?.source.body.replaceAll(WhiteSpace, ' '),
		variableValues
	)

	// Call the original execute function
	return call(execute, args)
}

useServer({ schema, execute: loggingExecute, subscribe, context }, server)

console.log('Listening to port 6173')
