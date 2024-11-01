import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'

type LastProjectId = number

@injectable()
export class ProjectService {
	async initializeProject(
		user: LoggedInUser,
		ctx: Context
	): Promise<LastProjectId> {
		return 0
	}
}
