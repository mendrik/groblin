import { NodeType } from '@shared/enums.ts'
import { failOn } from '@shared/utils/guards.ts'
import { sql } from 'kysely'
import { T, isNil } from 'ramda'
import type { Context } from 'src/context.ts'
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Subscription
} from 'type-graphql'

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

@Resolver()
export class NodeResolver {
	@Subscription(returns => Boolean, {
		topics: 'NODES_UPDATED',
		filter: T
	})
	nodesUpdated() {
		return true
	}

	@Query(returns => [Node])
	get_nodes(@Ctx() { db }: Context) {
		return db.selectFrom('node').selectAll().orderBy('order', 'asc').execute()
	}

	@Mutation(returns => Node)
	async insert_node(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() { db, pubSub }: Context
	): Promise<Node> {
		const res = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>=', data.order)
				.where('parent_id', '=', data.parent_id ?? null)
				.set({ order: sql`"order" + 1` })
				.execute()

			return trx
				.insertInto('node')
				.values(data) // Adjust this according to the structure of your node
				.returning('id as id')
				.executeTakeFirst()
		})
		if (!res?.id) {
			throw new Error('Failed to insert node')
		}
		pubSub.publish('NODES_UPDATED', true)
		return await this.getNode(db, res.id)
	}

	async getNode(db: Context['db'], id: number): Promise<Node> {
		return db
			.selectFrom('node')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()
			.then(failOn(isNil, 'Node not found')) as Promise<Node>
	}

	@Mutation(returns => Boolean)
	async update_node(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() { db, pubSub }: Context
	): Promise<boolean> {
		const { numUpdatedRows = 0 } = await db
			.updateTable('node')
			.set(data)
			.where('id', '=', data.id)
			.executeTakeFirst()

		pubSub.publish('NODES_UPDATED', true)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async delete_node_by_id(
		@Arg('id', () => Int) id: number,
		@Arg('parent_id', () => Int) parent_id: number | undefined,
		@Arg('order', () => Int) order: number,
		@Ctx() { db, pubSub }: Context
	): Promise<boolean> {
		const { numDeletedRows } = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>', order)
				.where('parent_id', '=', parent_id ?? null)
				.set({ order: sql`"order" - 1` })
				.execute()

			return trx.deleteFrom('node').where('id', '=', id).executeTakeFirst()
		})
		pubSub.publish('NODES_UPDATED', { nodesUpdated: [] })
		return numDeletedRows > 0
	}
}
