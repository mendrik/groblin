import type { ServerResponse } from 'node:http'

export function ErrorHandler(
	handler = (res: ServerResponse, _error: any) => {
		res.writeHead(500, { 'Content-Type': 'text/plain' })
		res.end('Request failed')
	}
) {
	return (
		_target: any,
		_propertyKey: string,
		descriptor: PropertyDescriptor
	) => {
		const originalMethod = descriptor.value

		descriptor.value = async function (...args: any[]) {
			const res = args[1] // Assuming the response object is the second argument
			try {
				return await originalMethod.apply(this, args)
			} catch (error) {
				console.error(error)
				handler(res, error)
			}
		}

		return descriptor
	}
}
