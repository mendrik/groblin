import type { Context } from 'src/context.ts'
import type { AuthChecker } from 'type-graphql'

export const authChecker: AuthChecker<Context> = (
	{ root, args, context, info },
	roles
) => {
	// Read user from context
	// and check the user's permission against the `roles` argument
	// that comes from the '@Authorized' decorator, eg. ["ADMIN", "MODERATOR"]

	return true // or 'false' if access is denied
}
