import { assertExists } from '@shared/asserts.ts'
import { failOn } from '@shared/utils/guards.ts'
import { injectable } from 'inversify'
import { sql } from 'kysely'
import { T, isNil } from 'ramda'
import type { Context } from 'src/context.ts'
import { EditorType, NodeType, Role } from 'src/enums.ts'
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

registerEnumType(NodeType, {
	name: 'NodeType'
})

registerEnumType(EditorType, {
	name: 'EditorType'
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
	tag_id: number
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
		filter: T
	})
	nodesUpdated() {
		return true
	}

	@Query(returns => [Node])
	async getNodes(@Ctx() { db, extra: user }: Context) {
		return db
			.selectFrom('node')
			.where('project_id', '=', user.lastProjectId)
			.selectAll()
			.orderBy('order', 'asc')
			.execute()
	}

	@Mutation(returns => Node)
	async insertNode(
		@Arg('data', () => InsertNode) data: InsertNode,
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<Node> {
		const { id } = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>=', data.order)
				.where('parent_id', '=', data.parent_id ?? null)
				.set({ order: sql`"order" + 1` })
				.execute()

			assertExists(data.parent_id, 'Parent ID must be provided')
			const { tag_id } = await this.getNode(db, data.parent_id)

			return trx
				.insertInto('node')
				.values({
					...data,
					tag_id,
					project_id: user.lastProjectId
				})
				.returning('id')
				.executeTakeFirstOrThrow()
		})
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

	@Mutation(returns => Boolean)
	async updateNode(
		@Arg('data', () => ChangeNodeInput) data: ChangeNodeInput,
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<boolean> {
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
		@Ctx() { db, pubSub, extra: user }: Context
	): Promise<boolean> {
		const { numDeletedRows } = await db.transaction().execute(async trx => {
			trx
				.updateTable('node')
				.where('order', '>', order)
				.where('parent_id', '=', parent_id ?? null)
				.where('project_id', '=', user.lastProjectId)
				.set({ order: sql`"order" - 1` })
				.execute()

			return trx.deleteFrom('node').where('id', '=', id).executeTakeFirst()
		})
		pubSub.publish(Topic.NodesUpdated, { nodesUpdated: [] })
		return numDeletedRows > 0
	}
}
