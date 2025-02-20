import type { ServerResponse } from 'node:http'

export function ErrorHandler(
	handler = (res: ServerResponse, error: any) => {
		res.writeHead(500, error.message)
		res.end(error.message)
	}
) {
	return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value

		descriptor.value = async function (...args: any[]) {
			const res = args[1] // Assuming the response object is the second argument
			try {
				return await originalMethod.apply(this, args)
			} catch (error) {
				handler(res, error)
			}
		}

		return descriptor
	}
}
