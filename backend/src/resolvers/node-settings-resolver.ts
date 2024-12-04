import { GraphQLJSONObject } from 'graphql-scalars'
import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { JsonValue } from 'src/database/schema.ts'
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
	@Subscription(returns => Boolean, {
		topics: Topic.NodeSettingsUpdated,
		filter: matchesLastProject
	})
	nodeSettingsUpdated(@Arg('projectId', () => Int) _: number) {
		return true
	}

	@Query(returns => [NodeSettings])
	async getNodeSettings(
		@Ctx() { db, extra: user }: Context
	): Promise<NodeSettings[]> {
		return db
			.selectFrom('node_settings')
			.where('project_id', '=', user.lastProjectId)
			.selectAll()
			.execute()
	}

	@Mutation(returns => Int)
	async upsertNodeSettings(
		@Arg('data', () => UpsertNodeSettings) data: UpsertNodeSettings,
		@Ctx() { db, extra: user, pubSub }: Context
	) {
		console.log('upsertNodeSettings', data)

		const { id } = await db
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
			.returning('id as id')
			.executeTakeFirstOrThrow()
		pubSub.publish(Topic.NodeSettingsUpdated, true)
		return id
	}
}
