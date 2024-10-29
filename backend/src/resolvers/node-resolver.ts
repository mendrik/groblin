import { NodeType } from '@shared/enums.ts'
import { failOn } from '@shared/utils/promises.ts'
import { sql } from 'kysely'
import { T, isNil } from 'ramda'
import type { Context } from 'src/database.ts'
import { pubSub } from 'src/pubsub.ts'
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
	Root,
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
	@Subscription(returns => [Node], {
		topics: 'NODE_UPDATED',
		filter: T
	})
	nodesUpdated(@Root() updatedNodes: Node[]): Node[] {
		return updatedNodes
	}

	@Query(returns => [Node])
	get_nodes(@Ctx() { db }: Context) {
		return db.selectFrom('node').selectAll().orderBy('order', 'asc').execute()
	}

	@Mutation(returns => Node)
	async insert_node(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() { db }: Context
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
		return this.publishNodeUpdate(db, res.id)
	}

	async publishNodeUpdate(db: Context['db'], id: number): Promise<Node> {
		const newNode = await db
			.selectFrom('node')
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()
			.then(failOn(isNil, 'Node not found'))

		pubSub.publish('NODE_UPDATED', { nodesUpdated: [newNode] })

		return newNode as Node
	}

	@Mutation(returns => Boolean)
	async update_node(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() { db }: Context
	): Promise<boolean> {
		const { numUpdatedRows = 0 } = await db
			.updateTable('node')
			.set(data)
			.where('id', '=', data.id)
			.executeTakeFirst()

		this.publishNodeUpdate(db, data.id)
		return numUpdatedRows > 0 // Returns true if at least one row was updated
	}

	@Mutation(returns => Boolean)
	async delete_node_by_id(
		@Arg('id', () => Int) id: number,
		@Arg('parent_id', () => Int) parent_id: number | undefined,
		@Arg('order', () => Int) order: number,
		@Ctx() { db }: Context
	): Promise<boolean> {
		const { numDeletedRows } = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>=', order)
				.where('parent_id', '=', parent_id ?? null)
				.set({ order: sql`"order" - 1` })
				.execute()

			return db.deleteFrom('node').where('id', '=', id).executeTakeFirst()
		})
		pubSub.publish('NODE_UPDATED', { nodesUpdated: [] })
		return numDeletedRows > 0
	}
}
