import { memberRole, projectNameSchema } from '@shared/project-roles.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable } from 'inversify'
import { Kysely, type Transaction } from 'kysely'
import type { DB } from '../database/schema.ts'
import { NodeType, Role } from '../types.ts'
import { ensureContentBaseline } from './content-revisions.ts'

@injectable()
export class ProjectService {
	@inject(Kysely)
	private db: Kysely<DB>

	async getProjects(userId: string) {
		return this.db
			.selectFrom('project')
			.innerJoin('project_user', 'project_user.project_id', 'project.id')
			.select([
				'project.id',
				'project.name',
				'project.version',
				'project_user.roles'
			])
			.where('project_user.user_id', '=', userId)
			.where('confirmed', '=', true)
			.orderBy('project.name')
			.orderBy('project.id')
			.execute()
			.then(rows =>
				rows.map(({ roles, ...project }) => ({
					...project,
					role: memberRole(roles)
				}))
			)
	}

	async rememberProject(db: Kysely<DB>, userId: string, projectId: number) {
		await db
			.insertInto('history')
			.values({ user_id: userId, current_project_id: projectId })
			.onConflict(c =>
				c.column('user_id').doUpdateSet({ current_project_id: projectId })
			)
			.execute()
	}

	private async create(trx: Transaction<DB>, userId: string, name: string) {
		const user = await trx
			.selectFrom('user')
			.select(['id', 'name'])
			.where('id', '=', userId)
			.forUpdate()
			.executeTakeFirstOrThrow()
		const { id: project_id } = await trx
			.insertInto('project')
			.values({ name })
			.returning('id')
			.executeTakeFirstOrThrow()
		await trx
			.insertInto('project_user')
			.values({
				project_id,
				user_id: userId,
				roles: [Role.Owner],
				owner: true,
				confirmed: true
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
			.execute()
		await this.rememberProject(trx, userId, project_id)
		await ensureContentBaseline(trx, { project_id, user })
		return project_id
	}

	async createProject(userId: string, name: string) {
		return this.db
			.transaction()
			.execute(trx => this.create(trx, userId, projectNameSchema.parse(name)))
	}

	/** Account linking and retried signup hooks must never create another initial project. */
	async initializeProject(userId: string) {
		return this.db.transaction().execute(async trx => {
			await trx
				.selectFrom('user')
				.select('id')
				.where('id', '=', userId)
				.forUpdate()
				.executeTakeFirstOrThrow()
			const existing = await trx
				.selectFrom('project_user')
				.select('project_id')
				.where('user_id', '=', userId)
				.where('confirmed', '=', true)
				.orderBy('project_id')
				.executeTakeFirst()
			if (existing) {
				const remembered = await trx
					.selectFrom('history')
					.select('current_project_id')
					.where('user_id', '=', userId)
					.executeTakeFirst()
				if (!remembered?.current_project_id)
					await this.rememberProject(trx, userId, existing.project_id)
				return existing.project_id
			}
			return this.create(trx, userId, 'My Project')
		})
	}

	async switchProject(userId: string, id: number) {
		return this.db.transaction().execute(async trx => {
			await trx
				.selectFrom('user')
				.select('id')
				.where('id', '=', userId)
				.forUpdate()
				.executeTakeFirstOrThrow()
			const member = await trx
				.selectFrom('project_user')
				.select('project_id')
				.where('project_id', '=', id)
				.where('user_id', '=', userId)
				.where('confirmed', '=', true)
				.executeTakeFirst()
			if (!member)
				throw new GraphQLError('Project not found', {
					extensions: { code: 'NOT_FOUND' }
				})
			await this.rememberProject(trx, userId, id)
			return true
		})
	}
}
