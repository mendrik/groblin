import { sql } from 'kysely'
import type { Context } from 'src/database.ts'
import { EditorType, NodeType } from 'src/resolvers/models/enums.ts'
import {
	Arg,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver
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

	@Field(type => EditorType)
	editor: EditorType
}

@InputType()
export class InsertNode {
	@Field(type => String)
	name: string

	@Field(type => Int)
	order: number

	@Field(type => NodeType)
	type: NodeType

	@Field(type => EditorType)
	editor: EditorType

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
	@Query(returns => [Node])
	async get_nodes(@Ctx() { db }: Context) {
		await db.selectFrom('node').selectAll().orderBy('order', 'asc').execute()
	}

	@Mutation(returns => Int)
	async insert_node(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() { db }: Context
	): Promise<number> {
		const res = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>=', data.order)
				.where('parent_id', '=', data.parent_id ?? null)
				.set({ order: sql`order + 1` })
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
		return res.id
	}

	@Mutation(returns => Boolean)
	async update_node(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { numUpdatedRows = 0 } = await ctx.db
			.updateTable('node')
			.set(data)
			.where('id', '=', data.id)
			.executeTakeFirst()
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
				.set({ order: sql`order - 1` })
				.execute()

			return db.deleteFrom('node').where('id', '=', id).executeTakeFirst()
		})
		return numDeletedRows > 0
	}
}
