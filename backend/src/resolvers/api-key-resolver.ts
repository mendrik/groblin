import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import type { Context } from 'src/types.ts'
import { Role, Topic } from 'src/types.ts'

import { randomBytes } from 'node:crypto'

import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
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

@InputType()
export class CreateApiKey {
	@Field(type => String)
	name: string

	@Field(type => Date, { nullable: true })
	expires_at: Date | null
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
		return this.db
			.selectFrom('api_key')
			.where('project_id', '=', ctx.project_id)
			.select([
				'name',
				'key',
				'is_active',
				'created_at',
				'expires_at',
				'last_used'
			])
			.orderBy('created_at', 'desc')
			.execute()
	}

	@Mutation(returns => ApiKey)
	async createApiKey(
		@Ctx() ctx: Context,
		@Arg('data', () => CreateApiKey) data: CreateApiKey
	): Promise<ApiKey> {
		const { project_id } = ctx
		const key = randomBytes(32).toString('hex')
		const result = await this.db
			.insertInto('api_key')
			.values({
				...data,
				key,
				project_id,
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

	@Mutation(returns => Boolean)
	async deleteApiKey(
		@Ctx() ctx: Context,
		@Arg('key', () => String) key: string
	): Promise<boolean> {
		const result = await this.db
			.deleteFrom('api_key')
			.where('key', '=', key)
			.where('project_id', '=', ctx.project_id)
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.ApiKeysUpdated)
		return result.numDeletedRows > 0
	}

	@Mutation(returns => Boolean)
	async toggleApiKey(
		@Ctx() ctx: Context,
		@Arg('key', () => String) key: string
	): Promise<boolean> {
		const result = await this.db
			.updateTable('api_key')
			.where('key', '=', key)
			.where('project_id', '=', ctx.project_id)
			.set('is_active', sql`NOT is_active`)
			.executeTakeFirstOrThrow()
		this.pubSub.publish(Topic.ApiKeysUpdated)
		return result.numUpdatedRows > 0
	}
}
