import type { ServerOptions } from 'graphql-ws'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'

export const onError: ServerOptions['onError'] = (
	ctx,
	message,
	_payload,
	errors
) => {
	const { extra } = ctx
	const user = extra as LoggedInUser
	console.error(`${user?.email}: ${message}`, ...errors)
}
