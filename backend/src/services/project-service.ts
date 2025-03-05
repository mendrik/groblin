import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import type { Context } from 'src/types.ts'
import { NodeType, Role } from 'src/types.ts'
import type { PubSub } from 'type-graphql'

type LastProjectId = number

@injectable()
export class ProjectService {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	async initializeProject({ user }: Context): Promise<LastProjectId> {
		return this.db.transaction().execute(async trx => {
			const { id: project_id } = await trx
				.insertInto('project')
				.values({
					name: 'My Project'
				})
				.returning('id')
				.executeTakeFirstOrThrow()

			await trx
				.insertInto('project_user')
				.values({
					project_id,
					user_id: user.id,
					roles: [Role.Admin]
				})
				.executeTakeFirstOrThrow()

			await trx
				.insertInto('history')
				.values({
					user_id: user.id,
					current_project_id: project_id
				})
				.execute()

			await trx
				.insertInto('node')
				.values({
					name: 'Root',
					type: NodeType.root,
					order: 0,
					parent_id: null,
					project_id
				})
				.returning('id')
				.executeTakeFirstOrThrow()

			return project_id
		})
	}
}
