import type { RouteHandler } from 'fastify'

export const index: RouteHandler = (request, reply) => {
	return { hello: 'world' }
}

export default index
