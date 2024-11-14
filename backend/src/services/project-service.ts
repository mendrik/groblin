import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import { NodeType, Role } from 'src/enums.ts'
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
				.updateTable('user')
				.set({ last_project_id: project_id })
				.where('id', '=', user.id)
				.execute()

			const { id: tag_id } = await trx
				.insertInto('tag')
				.values({
					name: 'Default',
					project_id,
					master: true
				})
				.returning('id')
				.executeTakeFirstOrThrow()

			await trx
				.insertInto('node')
				.values({
					name: 'Root',
					type: NodeType.root,
					order: 0,
					parent_id: null,
					project_id,
					tag_id
				})
				.returning('id')
				.executeTakeFirstOrThrow()

			return project_id
		})
	}
}
