import { contentSnapshotSchema } from '@shared/content-snapshot.ts'
import { projectNameSchema } from '@shared/project-roles.ts'
import { GraphQLError } from 'graphql'
import type { ProjectData } from '../gql/schema.ts'
import { requireProjectFile } from '../security/project-access.ts'
import { requireProjectRole } from '../security/require-role.ts'
import {
	ensureContentBaseline,
	recordContentRevision,
	requireRevision
} from '../services/content-revisions.ts'
import {
	lockProject,
	validateProjectModel
} from '../services/model-validation.ts'
import { ProjectService } from '../services/project-service.ts'
import { type PubSub, Role, Topic } from '../types.ts'
import { isJsonObject } from '../utils/json.ts'

export type { Project, ProjectData } from '../gql/schema.ts'

import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import { failOn } from 'matchblade'
import { isNil } from 'ramda'
import type { DB } from 'src/database/schema.ts'
import type { Context } from 'src/types.ts'
import type { Publication } from '../gql/schema.ts'
import { validatePublication } from '../services/publication-validation.ts'
import { parseNode } from '../utils/parse-node.ts'

@injectable()
export class ProjectResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@inject(ProjectService)
	private projects: ProjectService

	async getPublication(ctx: Context) {
		return this.db
			.transaction()
			.setIsolationLevel('repeatable read')
			.execute(async trx => {
				const project = await trx
					.selectFrom('project')
					.select(['version', 'published_revision_id'])
					.where('id', '=', ctx.project_id)
					.executeTakeFirstOrThrow()
				const history = await trx
					.selectFrom('content_publication')
					.innerJoin(
						'content_revision',
						'content_revision.id',
						'content_publication.revision_id'
					)
					.select([
						'content_publication.id',
						'revision_id',
						'content_revision.version',
						'content_publication.author_name',
						'content_publication.created_at',
						'summary'
					])
					.where('content_publication.project_id', '=', ctx.project_id)
					.orderBy('content_publication.id', 'desc')
					.limit(100)
					.execute()
				return {
					draftVersion: project.version,
					current:
						history.find(
							row => row.revision_id === project.published_revision_id
						) ?? null,
					history
				}
			})
	}

	async publishContent(
		expectedVersion: number,
		expectedPublication: number,
		revisionId: number | undefined,
		ctx: Context
	): Promise<Publication> {
		return this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const project = await trx
				.selectFrom('project')
				.select(['version'])
				.where('id', '=', ctx.project_id)
				.executeTakeFirstOrThrow()
			requireRevision(expectedVersion, project.version, 'Draft content')
			const last = await trx
				.selectFrom('content_publication')
				.select('id')
				.where('project_id', '=', ctx.project_id)
				.orderBy('id', 'desc')
				.executeTakeFirst()
			requireRevision(expectedPublication, last?.id ?? 0, 'Publication')
			await validateProjectModel(trx, ctx.project_id)
			await ensureContentBaseline(trx, ctx)
			const row = await trx
				.selectFrom('content_revision')
				.selectAll()
				.where('project_id', '=', ctx.project_id)
				.$if(revisionId !== undefined, query =>
					query.where('id', '=', revisionId ?? 0)
				)
				.$if(revisionId === undefined, query =>
					query.where('version', '=', project.version)
				)
				.executeTakeFirst()
			if (!row)
				throw new GraphQLError('Content revision not found', {
					extensions: { code: 'NOT_FOUND' }
				})
			const snapshot = contentSnapshotSchema.parse(row.snapshot)
			if (
				snapshot.project.id !== ctx.project_id ||
				[...snapshot.nodes, ...snapshot.settings, ...snapshot.values].some(
					row => row.project_id !== ctx.project_id
				)
			)
				throw new GraphQLError('Invalid publication project', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			validatePublication(snapshot)
			await trx
				.updateTable('project')
				.set({ published_revision_id: row.id })
				.where('id', '=', ctx.project_id)
				.execute()
			const publication = await trx
				.insertInto('content_publication')
				.values({
					project_id: ctx.project_id,
					revision_id: row.id,
					author_id: ctx.user.id,
					author_name: ctx.user.name
				})
				.returning(['id', 'revision_id', 'created_at', 'author_name'])
				.executeTakeFirstOrThrow()
			return { ...publication, version: row.version, summary: row.summary }
		})
	}

	async getWorkspace(ctx: Context) {
		const projects = await this.projects.getProjects(ctx.user.id)
		return {
			projects,
			currentProject:
				projects.find(project => project.id === ctx.project_id) ?? null
		}
	}

	createProject(name: string, ctx: Context) {
		return this.projects.createProject(ctx.user.id, name)
	}

	switchProject(id: number, ctx: Context) {
		return this.projects.switchProject(ctx.user.id, id)
	}

	async renameProject(name: string, expectedVersion: number, ctx: Context) {
		const validated = projectNameSchema.parse(name)
		return this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const project = await trx
				.selectFrom('project')
				.selectAll()
				.where('id', '=', ctx.project_id)
				.executeTakeFirstOrThrow()
			requireRevision(expectedVersion, project.version, 'Project')
			await ensureContentBaseline(trx, ctx)
			await trx
				.updateTable('project')
				.set({ name: validated })
				.where('id', '=', ctx.project_id)
				.execute()
			return recordContentRevision(trx, ctx, `Renamed project to ${validated}`)
		})
	}

	async deleteProject(
		expectedVersion: number,
		confirmation: string,
		ctx: Context
	) {
		return this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Owner])
			const project = await trx
				.selectFrom('project')
				.selectAll()
				.where('id', '=', ctx.project_id)
				.executeTakeFirstOrThrow()
			requireRevision(expectedVersion, project.version, 'Project')
			if (confirmation !== project.name)
				throw new GraphQLError('Type the project name to confirm deletion', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			await trx
				.insertInto('media_cleanup_job')
				.values({ prefix: `project_${ctx.project_id}/` })
				.execute()
			await trx.deleteFrom('project').where('id', '=', ctx.project_id).execute()
			return true
		})
	}

	async transferProjectOwnership(userId: string, ctx: Context) {
		const result = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Owner])
			const target = await trx
				.selectFrom('project_user')
				.selectAll()
				.where('project_id', '=', ctx.project_id)
				.where('user_id', '=', userId)
				.where('confirmed', '=', true)
				.executeTakeFirst()
			if (!target)
				throw new GraphQLError('Choose a confirmed project member', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			if (target.owner) return true
			await trx
				.updateTable('project_user')
				.set({ owner: false, roles: [Role.Admin] })
				.where('project_id', '=', ctx.project_id)
				.where('user_id', '=', ctx.user.id)
				.execute()
			await trx
				.updateTable('project_user')
				.set({ owner: true, roles: [Role.Owner] })
				.where('project_id', '=', ctx.project_id)
				.where('user_id', '=', userId)
				.execute()
			return true
		})
		this.pubSub.publish(Topic.UsersUpdated, ctx.project_id)
		return result
	}

	async getContentRevisions(ctx: Context, before?: number, limit = 30) {
		if (
			!Number.isInteger(limit) ||
			limit < 1 ||
			limit > 100 ||
			(before !== undefined && before < 0)
		)
			throw new GraphQLError('Choose a page size from 1 to 100', {
				extensions: { code: 'BAD_USER_INPUT' }
			})
		return this.db
			.selectFrom('content_revision')
			.select(['id', 'version', 'created_at', 'author_name', 'summary'])
			.where('project_id', '=', ctx.project_id)
			.$if(before !== undefined, query =>
				query.where('version', '<', before ?? 0)
			)
			.orderBy('version', 'desc')
			.limit(limit)
			.execute()
	}

	async getContentRevision(id: number, ctx: Context) {
		const row = await this.db
			.selectFrom('content_revision')
			.selectAll()
			.where('id', '=', id)
			.where('project_id', '=', ctx.project_id)
			.executeTakeFirst()
		if (!row)
			throw new GraphQLError('Revision not found', {
				extensions: { code: 'BAD_USER_INPUT' }
			})
		return {
			revision: row,
			snapshot: contentSnapshotSchema.parse(row.snapshot)
		}
	}

	async restoreContentRevision(
		id: number,
		expectedVersion: number,
		ctx: Context
	) {
		const version = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const project = await trx
				.selectFrom('project')
				.selectAll()
				.where('id', '=', ctx.project_id)
				.executeTakeFirstOrThrow()
			requireRevision(expectedVersion, project.version, 'Project')
			const row = await trx
				.selectFrom('content_revision')
				.selectAll()
				.where('id', '=', id)
				.where('project_id', '=', ctx.project_id)
				.executeTakeFirst()
			if (!row)
				throw new GraphQLError('Revision not found', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			const snapshot = contentSnapshotSchema.parse(row.snapshot)
			if (
				snapshot.project.id !== ctx.project_id ||
				[...snapshot.nodes, ...snapshot.settings, ...snapshot.values].some(
					row => row.project_id !== ctx.project_id
				)
			)
				throw new GraphQLError('Invalid revision project', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			for (const value of snapshot.values)
				if (isJsonObject(value.value) && typeof value.value.file === 'string')
					requireProjectFile(ctx.project_id, value.value.file)
			await ensureContentBaseline(trx, ctx)
			// Project versions dominate all previously issued row versions, preventing ABA after restore.
			const revision = project.version + 1
			await trx
				.deleteFrom('node')
				.where('project_id', '=', ctx.project_id)
				.execute()
			for (const node of [...snapshot.nodes].sort((a, b) => a.depth - b.depth))
				await trx
					.insertInto('node')
					.values({ ...node, revision })
					.execute()
			if (snapshot.settings.length)
				await trx
					.insertInto('node_settings')
					.values(snapshot.settings.map(row => ({ ...row, revision })))
					.execute()
			if (snapshot.values.length)
				await trx
					.insertInto('values')
					.values(
						snapshot.values.map(row => ({
							...row,
							revision,
							updated_at: new Date()
						}))
					)
					.execute()
			await trx
				.updateTable('project')
				.set({ name: snapshot.project.name })
				.where('id', '=', ctx.project_id)
				.execute()
			await validateProjectModel(trx, ctx.project_id)
			return recordContentRevision(trx, ctx, `Restored version ${row.version}`)
		})
		for (const topic of [
			Topic.NodesUpdated,
			Topic.ValuesUpdated,
			Topic.SomeNodeSettingsUpdated,
			Topic.NodeSettingsUpdated
		])
			this.pubSub.publish(topic, ctx.project_id)
		return version
	}

	async getProject(ctx: Context): Promise<ProjectData> {
		return this.db
			.transaction()
			.setIsolationLevel('repeatable read')
			.execute(async trx => {
				const project = await trx
					.selectFrom('project')
					.selectAll()
					.where('id', '=', ctx.project_id)
					.executeTakeFirst()
					.then(failOn(isNil, 'Project not found'))
				const nodes = await trx
					.selectFrom('node')
					.selectAll()
					.where('project_id', '=', ctx.project_id)
					.orderBy('order')
					.orderBy('id')
					.execute()
					.then(rows => rows.map(parseNode))
				const values = await trx
					.selectFrom('values')
					.selectAll()
					.where('project_id', '=', ctx.project_id)
					.where(({ or, eb }) =>
						or([
							eb('list_path', '<@', sql.val([])),
							eb('list_path', 'is', null)
						])
					)
					.orderBy('order')
					.orderBy('id')
					.execute()
				const nodeSettings = await trx
					.selectFrom('node_settings')
					.selectAll()
					.where('project_id', '=', ctx.project_id)
					.execute()
					.then(rows =>
						rows.map(row => ({ ...row, settings: row.settings ?? {} }))
					)
				return { project, nodes, values, nodeSettings }
			})
	}
}
