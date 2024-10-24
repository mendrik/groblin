import { basename, dirname } from 'node:path'
import glob from 'fast-glob'
// Import the framework and instantiate it
import Fastify, { type HTTPMethods } from 'fastify'
import { drop, dropLast, pipe, prop, reverse, split } from 'ramda'

const fastify = Fastify({
	logger: {
		transport: {
			target: '@fastify/one-line-logger'
		}
	}
})

const files = await glob('./src/functions/**/*.ts')

const folder = pipe(dirname, split('/'), drop(3))

const fileMethod: (s: string) => string[] = pipe(
	basename,
	split(/_|\./),
	dropLast(1),
	xs => reverse(xs)
)

for (const file of files) {
	const [method, ...name] = fileMethod(file)
	const paths = folder(file)

	const handler = await import(file.replace('src/', '')).then(prop('default'))

	const config = {
		method: method.toUpperCase() as HTTPMethods,
		url: `/rest/${[...paths, name.join('_')].join('/')}`
	}

	console.log(config)

	fastify.route({ ...config, handler })
}

// Declare a route
fastify.post('/register', async (request, reply) => {
	return { hello: 'world' }
})

// Run the server!
try {
	await fastify.listen({ port: 6173 })
} catch (err) {
	fastify.log.error(err)
	process.exit(1)
}
