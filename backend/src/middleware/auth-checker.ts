import { injectable } from 'inversify'
import type { Context } from 'src/types.ts'
import type { AuthCheckerInterface, ResolverData } from 'type-graphql'

@injectable()
export class AuthChecker implements AuthCheckerInterface<Context> {
	check({ context }: ResolverData<Context>, roles: string[]): boolean {
		return context.user != null
	}
}
