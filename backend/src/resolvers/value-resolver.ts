import { parseContentValue } from '@shared/content.ts'
import { GraphQLError } from 'graphql'
import type {
	GetValues,
	InsertListItem,
	TruncateValue,
	UpsertValue,
	Value
} from '../gql/schema.ts'
import { DeletionKind } from '../gql/schema.ts'
import { requireProjectRole } from '../security/require-role.ts'
import {
	ensureContentBaseline,
	recordContentRevision,
	requireRevision
} from '../services/content-revisions.ts'
import { requireDeletionImpact } from '../services/deletion-impact.ts'
import { MediaAssets } from '../services/media-assets.ts'
import { lockProject } from '../services/model-validation.ts'
import type { PubSub } from '../types.ts'
import { NodeType, Role } from '../types.ts'

export type {
	GetValues,
	InsertListItem,
	TruncateValue,
	UpsertValue,
	Value
} from '../gql/schema.ts'

import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import type { Context } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import {
	requireListPath,
	requireNode,
	requireProjectFile
} from '../security/project-access.ts'
import { isJsonObject } from '../utils/json.ts'

@injectable()
export class ValueResolver {
	@inject(MediaAssets) private assets: MediaAssets
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	async getValues({ ids }: GetValues, ctx: Context): Promise<Value[]> {
		const { project_id } = ctx
		return this.db
			.selectFrom('values')
			.where('project_id', '=', project_id)
			.where(({ or, eb }) =>
				or([eb('list_path', '<@', sql.val(ids)), eb('list_path', 'is', null)])
			)
			.orderBy('order')
			.orderBy('id')
			.selectAll()
			.execute()
	}

	async value(id: number, projectId: number): Promise<Value | undefined> {
		return this.db
			.selectFrom('values')
			.where('id', '=', id)
			.where('project_id', '=', projectId)
			.selectAll()
			.executeTakeFirst()
	}

	async insertListItem(data: InsertListItem, ctx: Context) {
		const { project_id } = ctx
		const res = await this.db.transaction().execute(async trx => {
			await trx
				.selectFrom('project')
				.select('id')
				.where('id', '=', project_id)
				.forUpdate()
				.executeTakeFirstOrThrow()
			await requireProjectRole(trx, ctx, [Role.Admin, Role.Editor])
			const node = await requireNode(trx, project_id, data.node_id)
			await requireListPath(trx, project_id, data.node_id, data.list_path)
			if (node.type !== NodeType.list)
				throw new GraphQLError('Select a list node', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			const value = parseContentValue(node.type, { name: data.name })
			await ensureContentBaseline(trx, ctx)
			const { max_order } = await trx
				.selectFrom('values')
				.where('node_id', '=', data.node_id)
				.where('project_id', '=', project_id)
				.select(trx.fn.max('order').as('max_order'))
				.executeTakeFirstOrThrow()

			const res = await trx
				.insertInto('values')
				.values({
					node_id: data.node_id,
					project_id,
					value,
					list_path: data.list_path,
					order: (max_order ?? -1) + 1
				})
				.returningAll()
				.executeTakeFirstOrThrow()
			await recordContentRevision(trx, ctx, `Added item to ${node.name}`)
			return res
		})

		this.pubSub.publish(Topic.ValuesUpdated, res)
		return res.id
	}

	async deleteListItem(id: number, ctx: Context, expectedImpact: string) {
		const deleted = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin, Role.Editor])
			const snapshot = await requireDeletionImpact(
				trx,
				ctx.project_id,
				{ kind: DeletionKind.Value, id },
				expectedImpact
			)
			await ensureContentBaseline(trx, ctx)
			await trx
				.deleteFrom('values')
				.where('project_id', '=', ctx.project_id)
				.where(
					'id',
					'in',
					snapshot.values.map(row => row.id)
				)
				.execute()
			await recordContentRevision(
				trx,
				ctx,
				`Deleted ${snapshot.values.length} values`
			)
			return snapshot.values
		})
		for (const value of deleted) this.pubSub.publish(Topic.ValueDeleted, value)
		this.pubSub.publish(Topic.ValuesUpdated, ctx.project_id)
		return deleted.length > 0
	}

	async upsertValue(data: UpsertValue, ctx: Context) {
		const { project_id } = ctx
		const { res, prev } = await this.db.transaction().execute(async trx => {
			await trx
				.selectFrom('project')
				.select('id')
				.where('id', '=', project_id)
				.forUpdate()
				.executeTakeFirstOrThrow()
			await requireProjectRole(trx, ctx, [Role.Admin, Role.Editor])
			const node = await requireNode(trx, project_id, data.node_id)
			await requireListPath(trx, project_id, data.node_id, data.list_path)
			if (isJsonObject(data.value) && typeof data.value.file === 'string')
				requireProjectFile(project_id, data.value.file)
			const prev = data.id
				? await trx
						.selectFrom('values')
						.selectAll()
						.where('id', '=', data.id)
						.where('project_id', '=', project_id)
						.executeTakeFirst()
				: node.type === NodeType.list
					? undefined
					: await trx
							.selectFrom('values')
							.selectAll()
							.where('node_id', '=', data.node_id)
							.where('project_id', '=', project_id)
							.where(
								sql<boolean>`coalesce(list_path, '{}'::integer[]) = ${data.list_path ?? []}::integer[]`
							)
							.executeTakeFirst()
			if (data.id && (!prev || prev.node_id !== data.node_id))
				throw new GraphQLError('Value no longer available', {
					extensions: { code: 'CONFLICT' }
				})
			requireRevision(data.expectedRevision, prev?.revision ?? 0, 'Value')
			if (!data.id && prev)
				throw new GraphQLError(
					'A value was already created. Review the latest version.',
					{ extensions: { code: 'CONFLICT' } }
				)
			if (
				prev &&
				JSON.stringify(prev.list_path ?? []) !==
					JSON.stringify(data.list_path ?? [])
			)
				throw new GraphQLError('A value cannot be moved to another list item', {
					extensions: { code: 'BAD_USER_INPUT' }
				})
			const settings = await trx
				.selectFrom('node_settings')
				.select('settings')
				.where('node_id', '=', data.node_id)
				.where('project_id', '=', project_id)
				.executeTakeFirst()
			const value = parseContentValue(node.type, data.value, settings?.settings)
			await this.assets.requireFiles(trx, project_id, value)
			await ensureContentBaseline(trx, ctx)

			const res = await trx
				.insertInto('values')
				.values({
					id: data.id ?? undefined,
					node_id: data.node_id,
					project_id,
					value,
					list_path: data.list_path
				})
				.onConflict(c =>
					c
						.column('id')
						.doUpdateSet(e => ({
							value: e.ref('excluded.value')
						}))
						.where('values.project_id', '=', project_id)
						.where('values.node_id', '=', data.node_id)
				)
				.returningAll()
				.executeTakeFirstOrThrow()
			await recordContentRevision(trx, ctx, `Changed ${node.name}`)
			return { res, prev }
		})
		if (
			prev != null &&
			(!isJsonObject(prev.value) ||
				!isJsonObject(data.value) ||
				prev.value.file !== data.value.file)
		) {
			this.pubSub.publish(Topic.ValueDeleted, prev)
		}
		this.pubSub.publish(Topic.ValuesUpdated, res)
		return res
	}

	async truncate(data: TruncateValue, ctx: Context) {
		const deleted = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin, Role.Editor])
			const snapshot = await requireDeletionImpact(
				trx,
				ctx.project_id,
				{ kind: DeletionKind.NodeValues, id: data.node_id },
				data.expectedImpact
			)
			if (!snapshot.values.length) return []
			await ensureContentBaseline(trx, ctx)
			await trx
				.deleteFrom('values')
				.where('project_id', '=', ctx.project_id)
				.where(
					'id',
					'in',
					snapshot.values.map(row => row.id)
				)
				.execute()
			await recordContentRevision(
				trx,
				ctx,
				`Deleted ${snapshot.values.length} values`
			)
			return snapshot.values
		})
		for (const value of deleted) this.pubSub.publish(Topic.ValueDeleted, value)
		this.pubSub.publish(Topic.ValuesUpdated, ctx.project_id)
		return deleted.length > 0
	}

	async deleteValue(id: number, ctx: Context, expectedImpact: string) {
		return this.deleteListItem(id, ctx, expectedImpact)
	}
}
