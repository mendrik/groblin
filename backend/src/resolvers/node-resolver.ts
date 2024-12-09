import { assertExists } from '@shared/asserts.ts'
import { failOn } from '@shared/utils/guards.ts'
import { type TreeOf, listToTree } from '@shared/utils/list-to-tree.ts'
import { injectable } from 'inversify'
import { type Transaction, sql } from 'kysely'
import { isNil } from 'ramda'
import type { Context } from 'src/context.ts'
import type { DB } from 'src/database/schema.ts'
import { NodeType, Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Subscription,
	UseMiddleware,
	registerEnumType
} from 'type-graphql'
import { matchesLastProject } from './utils.ts'

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

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class NodeResolver {
	@Subscription(returns => Boolean, {
		topics: Topic.NodesUpdated,
		filter: matchesLastProject
	})
	nodesUpdated(@Arg('projectId', () => Int) _: number) {
		return true
	}

	@Query(returns => [Node])
	async getNodes(@Ctx() ctx: Context) {
		const { db, extra: user } = ctx
		return db
			.selectFrom('node')
			.where('project_id', '=', user.lastProjectId)
			.selectAll()
			.orderBy('order', 'asc')
			.execute()
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
				project_id: ctx.extra.lastProjectId
			})
			.returning('id')
			.executeTakeFirstOrThrow()
	}

	@Mutation(returns => Node)
	async insertNode(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() ctx: Context
	): Promise<Node> {
		const { db, extra: user, pubSub } = ctx
		const { id } = await db
			.transaction()
			.execute(async trx => this.insertNodeTrx(trx, data, ctx))
		pubSub.publish(Topic.NodesUpdated, true)
		return await this.getNode(db, id)
	}

	async getNode(db: Context['db'], id: number): Promise<Node> {
		return db
			.selectFrom('node')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()
			.then(failOn(isNil, 'Node not found')) as Promise<Node>
	}

	async getTreeNode(db: Context, id: number): Promise<TreeOf<Node, 'nodes'>> {
		function* allNodes(
			node: TreeOf<Node, 'nodes'>
		): Generator<TreeOf<Node, 'nodes'>> {
			yield node
			for (const child of node.nodes) {
				yield* allNodes(child)
			}
		}

		const nodes = await this.getNodes(db)
		const root = listToTree('id', 'parent_id', 'nodes')(nodes) as TreeOf<
			Node,
			'nodes'
		>
		const node = [...allNodes(root)].find(n => n.id === id)
		assertExists(node, 'Node not found')
		return node
	}

	@Mutation(returns => Boolean)
	async updateNode(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { db, pubSub, extra: user } = ctx
		const { numUpdatedRows = 0 } = await db
			.updateTable('node')
			.set(data)
			.where('id', '=', data.id)
			.where('project_id', '=', user.lastProjectId)
			.executeTakeFirst()

		pubSub.publish(Topic.NodesUpdated, true)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async deleteNodeById(
		@Arg('id', () => Int) id: number,
		@Arg('parent_id', () => Int) parent_id: number | undefined,
		@Arg('order', () => Int) order: number,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { db, pubSub, extra: user } = ctx
		const { numDeletedRows } = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>', order)
				.where('parent_id', '=', parent_id ?? null)
				.where('project_id', '=', user.lastProjectId)
				.where('type', '!=', NodeType.root)
				.set({ order: sql`"order" - 1` })
				.execute()

			return trx.deleteFrom('node').where('id', '=', id).executeTakeFirst()
		})
		pubSub.publish(Topic.NodesUpdated, { nodesUpdated: [] })
		return numDeletedRows > 0
	}
}
