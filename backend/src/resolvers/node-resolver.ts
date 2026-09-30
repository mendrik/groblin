import { parseNodeSettings } from '@shared/node-settings.ts'
import type { ChangeNodeInput, InsertNode, Node } from '../gql/schema.ts'
import { DeletionKind, type DeletionTarget } from '../gql/schema.ts'
import { requireProjectRole } from '../security/require-role.ts'
import {
	ensureContentBaseline,
	recordContentRevision,
	requireRevision
} from '../services/content-revisions.ts'
import {
	deletionSnapshot,
	requireDeletionImpact
} from '../services/deletion-impact.ts'
import {
	lockProject,
	validateProjectModel
} from '../services/model-validation.ts'
import type { PubSub } from '../types.ts'
import { Role } from '../types.ts'
import { parseNode } from '../utils/parse-node.ts'

export type { ChangeNodeInput, InsertNode, Node } from '../gql/schema.ts'

import { assertExists } from '@shared/asserts.ts'
import { inject, injectable } from 'inversify'
import { Kysely, sql, type Transaction } from 'kysely'
import { failOn, listToTree } from 'matchblade'
import { isNil } from 'ramda'
import type { DB, JsonValue } from 'src/database/schema.ts'
import type { Context, TreeNode } from 'src/types.ts'
import { NodeType, Topic } from 'src/types.ts'
import { allNodes } from 'src/utils/nodes.ts'
import { requireNode } from '../security/project-access.ts'

@injectable()
export class NodeResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	async getDbNodes(projectId: number): Promise<Node[]> {
		return this.db
			.selectFrom('node')
			.where('project_id', '=', projectId)
			.selectAll()
			.orderBy('order', 'asc')
			.execute()
			.then(rows => rows.map(parseNode))
	}

	async getDeletionImpact(target: DeletionTarget, ctx: Context) {
		return (await deletionSnapshot(this.db, ctx.project_id, target)).impact
	}

	async getNodes(ctx: Context): Promise<Node[]> {
		return this.getDbNodes(ctx.project_id)
	}

	async insertNodeTrx(trx: Transaction<DB>, data: InsertNode, ctx: Context) {
		assertExists(data.parent_id, 'Parent ID must be provided')
		await requireNode(trx, ctx.project_id, data.parent_id)
		await trx
			.updateTable('node')
			.where('project_id', '=', ctx.project_id)
			.where('order', '>=', data.order)
			.where('parent_id', '=', data.parent_id ?? null)
			.set({ order: sql`"order" + 1` })
			.execute()

		assertExists(data.parent_id, 'Parent ID must be provided')

		return trx
			.insertInto('node')
			.values({
				...data,
				project_id: ctx.project_id
			})
			.returning('id')
			.executeTakeFirstOrThrow()
	}

	async insertNode(
		data: InsertNode,

		settings: JsonValue | undefined,
		ctx: Context
	): Promise<Node> {
		const { project_id } = ctx
		const id = await this.db.transaction().execute(async trx => {
			await lockProject(trx, project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			await ensureContentBaseline(trx, ctx)
			const { id } = await this.insertNodeTrx(trx, data, ctx)
			if (settings) {
				await trx
					.insertInto('node_settings')
					.values({
						node_id: id,
						project_id,
						settings: parseNodeSettings(data.type, settings)
					})
					.execute()
			}
			await validateProjectModel(trx, project_id)
			await recordContentRevision(trx, ctx, `Added field ${data.name}`)
			return id
		})
		this.pubSub.publish(Topic.NodesUpdated, project_id)
		if (settings) {
			this.pubSub.publish(Topic.SomeNodeSettingsUpdated, project_id)
		}
		return await this.getNode(id, project_id)
	}

	async getNode(id: number, projectId: number): Promise<Node> {
		return this.db
			.selectFrom('node')
			.selectAll()
			.where('id', '=', id)
			.where('project_id', '=', projectId)
			.executeTakeFirst()
			.then(failOn(isNil, 'Node not found'))
			.then(parseNode)
	}

	async getTreeNode(projectId: number, id?: number): Promise<TreeNode> {
		const nodes = await this.getDbNodes(projectId)
		const root = listToTree('id', 'parent_id', 'nodes')(nodes)
		if (!id) return root
		const node = [...allNodes(root)].find(n => n.id === id)
		assertExists(node, 'Node not found')
		return node
	}

	async updateNode(data: ChangeNodeInput, ctx: Context): Promise<Node> {
		const { project_id } = ctx
		const updated = await this.db.transaction().execute(async trx => {
			await lockProject(trx, project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			const current = await requireNode(trx, project_id, data.id)
			requireRevision(data.expectedRevision, current.revision, 'Field')
			await ensureContentBaseline(trx, ctx)
			await trx
				.updateTable('node')
				.set({
					name: data.name,
					order: data.order ?? current.order,
					type: data.type ?? current.type,
					parent_id:
						data.parent_id === undefined ? current.parent_id : data.parent_id
				})
				.where('id', '=', data.id)
				.where('project_id', '=', project_id)
				.executeTakeFirstOrThrow()
			await validateProjectModel(trx, project_id)
			await recordContentRevision(trx, ctx, `Changed field ${current.name}`)
			return parseNode(
				await trx
					.selectFrom('node')
					.selectAll()
					.where('id', '=', data.id)
					.where('project_id', '=', project_id)
					.executeTakeFirstOrThrow()
			)
		})
		this.pubSub.publish(Topic.NodesUpdated, project_id)
		return updated
	}

	async deleteNodeById(
		id: number,
		_parent_id: number | undefined,
		_order: number,
		ctx: Context,
		expectedImpact: string
	): Promise<boolean> {
		const { project_id } = ctx
		const { result, values } = await this.db
			.transaction()
			.execute(async trx => {
				await lockProject(trx, project_id)
				await requireProjectRole(trx, ctx, [Role.Admin])
				const { values } = await requireDeletionImpact(
					trx,
					project_id,
					{ kind: DeletionKind.Node, id },
					expectedImpact
				)
				const node = await requireNode(trx, project_id, id)
				await ensureContentBaseline(trx, ctx)
				await trx
					.updateTable('node')
					.where('order', '>', node.order)
					.where('parent_id', '=', node.parent_id)
					.where('project_id', '=', project_id)
					.where('type', '!=', NodeType.root)
					.set({ order: sql`"order" - 1` })
					.execute()

				const result = await trx
					.deleteFrom('node')
					.where('id', '=', id)
					.where('project_id', '=', project_id)
					.executeTakeFirst()
				await validateProjectModel(trx, project_id)
				await recordContentRevision(trx, ctx, `Deleted field ${node.name}`)
				return { result, values }
			})
		this.pubSub.publish(Topic.NodesUpdated, project_id)
		for (const value of values) this.pubSub.publish(Topic.ValueDeleted, value)
		return result.numDeletedRows > 0
	}
}
