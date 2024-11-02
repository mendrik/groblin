import { NodeType, Role } from '@shared/enums.ts'
import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { LoggedInUser } from 'src/resolvers/auth-resolver.ts'

type LastProjectId = number

@injectable()
export class ProjectService {
	async initializeProject(
		user: LoggedInUser,
		{ db }: Context
	): Promise<LastProjectId> {
		return db.transaction().execute(async trx => {
			const { id: project_id } = await trx
				.insertInto('project')
				.values({
					id: user.id,
					name: 'My Project'
				})
				.returning('id')
				.executeTakeFirstOrThrow()

			await trx
				.insertInto('project_user')
				.values({
					project_id,
					user_id: user.id,
					role: Role.Admin
				})
				.executeTakeFirstOrThrow()

			await trx
				.insertInto('tag')
				.values({
					name: 'Default',
					project_id
				})
				.executeTakeFirstOrThrow()

			const { id: node_id } = await trx
				.insertInto('node')
				.values({
					name: 'Root',
					order: 0,
					parent_id: null,
					type: NodeType.root,
					project_id
				})
				.returning('id')
				.executeTakeFirstOrThrow()
			return project_id
		})
	}
}
