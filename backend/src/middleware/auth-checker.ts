import type { Context } from 'src/context.ts'
import type { AuthChecker } from 'type-graphql'

export const authChecker: AuthChecker<Context> = (
	{ root, args, context, info },
	roles
) => {
	return context.extra != null
}
