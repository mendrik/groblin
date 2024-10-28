import { Node } from '@shared/models/node.js'
import type { Context } from 'src/database.ts'
import { Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class NodeResolver {
	@Query(returns => [Node])
	async nodes(@Ctx() ctx: Context) {
		return ctx.db.node.findMany()
	}
}
