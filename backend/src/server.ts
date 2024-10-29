import 'dotenv/config'
import 'reflect-metadata'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { cyan, darkGray, lightGreen, lightYellow, yellow } from 'ansicolor'
import { type ExecutionArgs, execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { call } from 'ramda'
import { WebSocketServer } from 'ws'
import { context } from './context.ts'
import { schema as gqlSchema } from './schema-builder.ts'

const schema = makeExecutableSchema({ typeDefs: gqlSchema })

const port = Number.parseInt(process.env.PORT ?? '6173')

const server = new WebSocketServer({
	port,
	path: '/graphql'
})

const Content = /\s+\{(.|\n)*$/gim

// Custom execute function to add logging
const loggingExecute = async (args: ExecutionArgs) => {
	const { document, variableValues, contextValue } = args

	if (variableValues) {
		console.log(
			yellow('Graphql: ') +
				lightYellow(document.loc?.source.body.replace(Content, '').trim()),
			variableValues
		)
	} else {
		console.log(
			yellow('Graphql: ') +
				lightYellow(document.loc?.source.body.replace(Content, '').trim())
		)
	}

	// Call the original execute function
	return call(execute, args)
}

useServer({ schema, execute: loggingExecute, subscribe, context }, server)

console.log(darkGray('Port: ') + cyan(`Started server on ${lightGreen(port)}`))
