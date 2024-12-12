import type { GraphQLError } from 'graphql'
import type { Context, ErrorMessage } from 'graphql-ws'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'

export const onError = (
	ctx: Context,
	message: ErrorMessage,
	errors: readonly GraphQLError[]
) => {
	const { extra } = ctx
	const user = extra as LoggedInUser
	console.error(`${user?.email}: ${message}`, ...errors)
}
