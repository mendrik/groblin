import type { ServerOptions } from 'graphql-ws'
import type { User } from 'src/database/schema.ts'

export const onError: ServerOptions['onError'] = (
	ctx,
	message,
	_payload,
	errors
) => {
	const { extra } = ctx
	const user = extra as User
	console.error(`${user?.email}: ${message}`, ...errors)
}
