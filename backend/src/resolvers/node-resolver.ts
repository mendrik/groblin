import { EditorType, NodeType } from '@shared/models/enums.ts'
import { Node } from '@shared/models/node.js'
import type { Context } from 'src/database.ts'
import {
	Arg,
	Ctx,
	Field,
	ID,
	InputType,
	Int,
	Mutation,
	Query,
	Resolver
} from 'type-graphql'

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

	@Field(type => ID, { nullable: true })
	parent_id: number
}

@InputType()
export class ChangeNodeNameInput {
	@Field(type => ID)
	id: number

	@Field(type => String)
	name: string
}

@Resolver()
export class NodeResolver {
	@Query(returns => [Node])
	async nodes(@Ctx() ctx: Context) {
		return ctx.db.selectFrom('node').execute()
	}

	@Mutation(returns => Int)
	async insertNode(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() ctx: Context
	): Promise<number> {
		const [{ id }] = await ctx.db
			.insertInto('node')
			.values(data) // Adjust this according to the structure of your node
			.returning('id as id')
			.execute()
		return id
	}

	@Mutation(returns => Boolean)
	async changeNodeName(
		@Arg('data', () => ChangeNodeNameInput) data: ChangeNodeNameInput,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { numChangedRows = 0 } = await ctx.db
			.updateTable('node')
			.set({ name: data.name })
			.where('id', '=', data.id)
			.executeTakeFirst()
		return numChangedRows > 0
	}

	@Mutation(returns => Boolean)
	async deleteNodeById(
		@Arg('id', () => ID) id: number,
		@Ctx() ctx: Context
	): Promise<boolean> {
		const { numDeletedRows } = await ctx.db
			.deleteFrom('node')
			.where('id', '=', id)
			.executeTakeFirst()
		return numDeletedRows > 0
	}
}
