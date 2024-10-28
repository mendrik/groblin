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

	@Field(type => [Node], { defaultValue: [] })
	nodes: Node[]

	@Field(type => NodeType)
	type: NodeType

	@Field(type => EditorType)
	editor: EditorType

	@Field(type => ID, { nullable: true })
	parent_id: number
}

@Resolver()
export class NodeResolver {
	@Query(returns => [Node])
	async nodes(@Ctx() ctx: Context) {
		return ctx.db.selectFrom('node').execute()
	}

	@Mutation(returns => Node)
	async insertNode(
		@Arg('data') data: InsertNode,
		@Ctx() ctx: Context
	): Promise<number> {
		const [{ id }] = await ctx.db
			.insertInto('node')
			.values(data) // Adjust this according to the structure of your node
			.returning('id as id')
			.execute()
		return id
	}
}
