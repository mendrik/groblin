import { GraphQLJSONObject } from 'graphql-scalars'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB, JsonValue } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/types.ts'
import type { Context } from 'src/types.ts'
import { NodeType, Role } from 'src/types.ts'
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
	Subscription,
	UseMiddleware,
	registerEnumType
} from 'type-graphql'

registerEnumType(NodeType, {
	name: 'NodeType'
})

@ObjectType()
export class NodeSettings {
	@Field(type => Int)
	id: number

	@Field(type => Int)
	node_id: number

	@Field(type => GraphQLJSONObject)
	settings: JsonValue
}

@InputType()
export class UpsertNodeSettings {
	@Field(type => Int, { nullable: true })
	id?: number

	@Field(type => Int)
	node_id: number

	@Field(type => GraphQLJSONObject)
	settings: JsonValue
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class NodeSettingsResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Subscription(returns => Boolean, {
		topics: Topic.NodeSettingsUpdated
	})
	nodeSettingsUpdated() {
		return true
	}

	@Query(returns => [NodeSettings])
	async getNodeSettings(projectId: number): Promise<NodeSettings[]> {
		return this.db
			.selectFrom('node_settings')
			.where('project_id', '=', projectId)
			.selectAll()
			.execute()
	}

	@Mutation(returns => Int)
	async upsertNodeSettings(
		@Arg('data', () => UpsertNodeSettings) data: UpsertNodeSettings,
		@Ctx() ctx: Context
	) {
		const { user } = ctx
		const res = await this.db
			.insertInto('node_settings')
			.values({
				id: data.id,
				node_id: data.node_id,
				project_id: user.lastProjectId,
				settings: data.settings
			})
			.onConflict(c =>
				c.column('id').doUpdateSet(e => ({
					settings: e.ref('excluded.settings')
				}))
			)
			.returning(['id', 'node_id', 'settings'])
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.NodeSettingsUpdated, res)
		return res.id
	}
}
