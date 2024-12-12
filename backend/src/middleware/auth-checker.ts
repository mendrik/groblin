import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { AuthCheckerInterface, ResolverData } from 'type-graphql'

@injectable()
export class AuthChecker implements AuthCheckerInterface<Context> {
	check({ context }: ResolverData<Context>, roles: string[]): boolean {
		console.log('Auth', context)
		return context.user != null
	}
}
