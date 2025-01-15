import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import type { Context } from 'src/types.ts'
import { Role, Topic } from 'src/types.ts'

import { randomBytes } from 'node:crypto'

import {
	Authorized,
	Ctx,
	Field,
	Mutation,
	ObjectType,
	type PubSub,
	Query,
	Resolver,
	Subscription,
	UseMiddleware
} from 'type-graphql'

@ObjectType()
export class ApiKey {
	@Field(type => String)
	name: string

	@Field(type => String)
	key: string

	@Field(type => Boolean)
	is_active: boolean

	@Field(type => Date)
	created_at: Date

	@Field(type => Date, { nullable: true })
	expires_at: Date | null

	@Field(type => Date, { nullable: true })
	last_used: Date | null
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin)
@Resolver()
export class ApiKeyResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	@Subscription(returns => Boolean, {
		topics: Topic.ApiKeysUpdated
	})
	apiKeysUpdated() {
		return true
	}

	@Query(returns => [ApiKey])
	async getApiKeys(@Ctx() ctx: Context): Promise<ApiKey[]> {
		const { user } = ctx
		return this.db
			.selectFrom('api_key')
			.where('project_id', '=', user.lastProjectId)
			.select([
				'name',
				'key',
				'is_active',
				'created_at',
				'expires_at',
				'last_used'
			])
			.execute()
	}

	@Mutation(returns => ApiKey)
	async createApiKey(@Ctx() ctx: Context, name: string): Promise<ApiKey> {
		const { user } = ctx
		const key = randomBytes(32).toString('hex')
		const result = await this.db
			.insertInto('api_key')
			.values({
				name,
				key,
				project_id: user.lastProjectId,
				is_active: true,
				created_at: new Date()
			})
			.returning([
				'is_active',
				'key',
				'name',
				'last_used',
				'created_at',
				'expires_at'
			])
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.ApiKeysUpdated)
		return result
	}
}
