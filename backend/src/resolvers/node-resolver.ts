import { assertExists } from '@shared/asserts.ts'
import { GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Kysely, type Transaction, sql } from 'kysely'
import { failOn, listToTree } from 'matchblade'
import { isNil } from 'ramda'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/types.ts'
import type { Context, TreeNode } from 'src/types.ts'
import { NodeType, Role } from 'src/types.ts'
import { allNodes } from 'src/utils/nodes.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	Root,
	Subscription,
	UseMiddleware,
	registerEnumType
} from 'type-graphql'

registerEnumType(NodeType, {
	name: 'NodeType'
})

@ObjectType()
export class Node {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Int)
	order: number

	@Field(type => NodeType)
	type: NodeType

	@Field(type => Int, { nullable: true })
	parent_id?: number

	@Field(type => Int)
	depth: number
}

@InputType()
export class InsertNode {
	@Field(type => String)
	name: string

	@Field(type => Int)
	order: number

	@Field(type => NodeType)
	type: NodeType

	@Field(type => Int, { nullable: true })
	parent_id?: number
}

@InputType()
export class ChangeNodeInput {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Int, { nullable: true })
	order: number

	@Field(type => NodeType, { nullable: true })
	type: NodeType

	@Field(type => Int, { nullable: true })
	parent_id?: number
}

@InputType()
export class InsertNodeSettings {
	@Field(type => Int)
	id: number

	@Field(type => String)
	name: string

	@Field(type => Int, { nullable: true })
	order: number

	@Field(type => NodeType, { nullable: true })
	type: NodeType

	@Field(type => Int, { nullable: true })
	parent_id?: number
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class NodeResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Subscription(returns => Boolean, {
		topics: Topic.NodesUpdated
	})
	nodesUpdated(@Root() _projectId: number) {
		return true
	}
	async getDbNodes(projectId: number): Promise<Node[]> {
		return this.db
			.selectFrom('node')
			.where('project_id', '=', projectId)
			.selectAll()
			.orderBy('order', 'asc')
			.execute() as Promise<Node[]>
	}

	@Query(returns => [Node])
	async getNodes(@Ctx() ctx: Context): Promise<Node[]> {
		return this.getDbNodes(ctx.project_id)
	}

	insertNodeTrx(trx: Transaction<DB>, data: InsertNode, ctx: Context) {
		trx
			.updateTable('node')
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

	@Mutation(returns => Node)
	async insertNode(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Arg('settings', () => GraphQLJSONObject, { nullable: true })
		settings: JsonValue | undefined,
		@Ctx() ctx: Context
	): Promise<Node> {
		const { project_id } = ctx
		const id = await this.db.transaction().execute(async trx => {
			const { id } = await this.insertNodeTrx(trx, data, ctx)
			if (settings) {
				await trx
					.insertInto('node_settings')
					.values({
						node_id: id,
						project_id,
						settings
					})
					.execute()
			}
			return id
		})
		this.pubSub.publish(Topic.NodesUpdated, project_id)
		if (settings) {
			this.pubSub.publish(Topic.SomeNodeSettingsUpdated, project_id)
		}
		return await this.getNode(id)
	}

	async getNode(id: number): Promise<Node> {
		return this.db
			.selectFrom('node')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()
			.then(failOn(isNil, 'Node not found')) as Promise<Node>
	}

	async getTreeNode(projectId: number, id?: number): Promise<TreeNode> {
		const nodes = await this.getDbNodes(projectId)
		const root = listToTree('id', 'parent_id', 'nodes')(nodes)
		if (!id) return root
		const node = [...allNodes(root)].find(n => n.id === id)
		assertExists(node, 'Node not found')
		return node
	}

	@Mutation(returns => Boolean)
	async updateNode(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { project_id } = ctx
		const { numUpdatedRows = 0 } = await this.db
			.updateTable('node')
			.set(data)
			.where('id', '=', data.id)
			.where('project_id', '=', project_id)
			.executeTakeFirst()

		this.pubSub.publish(Topic.NodesUpdated, project_id)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async deleteNodeById(
		@Arg('id', () => Int) id: number,
		@Arg('parent_id', () => Int) parent_id: number | undefined,
		@Arg('order', () => Int) order: number,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { project_id } = ctx
		const { numDeletedRows } = await this.db
			.transaction()
			.execute(async trx => {
				trx
					.updateTable('node')
					.where('order', '>', order)
					.where('parent_id', '=', parent_id ?? null)
					.where('project_id', '=', project_id)
					.where('type', '!=', NodeType.root)
					.set({ order: sql`"order" - 1` })
					.execute()

				return trx.deleteFrom('node').where('id', '=', id).executeTakeFirst()
			})
		this.pubSub.publish(Topic.NodesUpdated, project_id)
		return numDeletedRows > 0
	}
}
