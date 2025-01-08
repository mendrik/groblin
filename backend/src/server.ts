import 'reflect-metadata'
import 'dotenv/config'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { cyan, lightGreen } from 'ansicolor'
import { execute, subscribe } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'
import { prop } from 'ramda'
import { WebSocketServer } from 'ws'
import { onConnect } from './middleware/on-connect.ts'
import { onError } from './middleware/on-errors.ts'
import { schema as gqlSchema } from './schema.ts'
import { ImageService } from './services/image-service.ts'

const schema = makeExecutableSchema({ typeDefs: gqlSchema })

const port = Number.parseInt(process.env.PORT ?? '6173')

const server = new WebSocketServer({
	port,
	path: '/graphql'
})

useServer(
	{
		schema,
		execute,
		subscribe,
		context: prop('extra'),
		onConnect,
		onError
	},
	server
)

console.log(cyan(`Started server on ${lightGreen(port)}`))

new ImageService()
