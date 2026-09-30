import type { ApiKey, CreateApiKey } from '../gql/schema.ts'
import type { PubSub } from '../types.ts'

export type { ApiKey, CreateApiKey } from '../gql/schema.ts'

import { randomBytes } from 'node:crypto'
import { Role } from '@shared/project-roles.ts'
import { inject, injectable } from 'inversify'
import { Kysely, sql } from 'kysely'
import type { DB } from 'src/database/schema.ts'
import type { Context } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { z } from 'zod'
import { hashApiKey } from '../security/api-key.ts'
import { requireProjectRole } from '../security/require-role.ts'
import { lockProject } from '../services/model-validation.ts'

const createKeySchema = z.object({
	name: z.string().trim().min(1).max(128),
	preview: z
		.boolean()
		.nullish()
		.transform(value => value ?? false),
	expires_at: z
		.date()
		.nullish()
		.refine(
			value => !value || value.getTime() > Date.now(),
			'Expiry must be in the future'
		)
})

@injectable()
export class ApiKeyResolver {
	@inject(Kysely)
	private db: Kysely<DB>

	@inject('PubSub')
	private pubSub: PubSub

	async getApiKeys(ctx: Context): Promise<ApiKey[]> {
		await requireProjectRole(this.db, ctx, [Role.Admin])
		return this.db
			.selectFrom('api_key')
			.where('project_id', '=', ctx.project_id)
			.select([
				'name',
				'preview',
				'key',
				'is_active',
				'created_at',
				'expires_at',
				'last_used'
			])
			.orderBy('created_at', 'desc')
			.execute()
	}

	private async write<T>(ctx: Context, action: (db: Kysely<DB>) => Promise<T>) {
		const result = await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(trx, ctx, [Role.Admin])
			return action(trx)
		})
		this.pubSub.publish(Topic.ApiKeysUpdated, ctx.project_id)
		return result
	}

	async createApiKey(ctx: Context, data: CreateApiKey): Promise<ApiKey> {
		const input = createKeySchema.parse(data)
		const { project_id } = ctx
		const key = randomBytes(32).toString('hex')
		const result = await this.write(ctx, db =>
			db
				.insertInto('api_key')
				.values({
					...input,
					key: hashApiKey(key),
					project_id,
					is_active: true,
					created_at: new Date()
				})
				.returning([
					'is_active',
					'key',
					'preview',
					'name',
					'last_used',
					'created_at',
					'expires_at'
				])
				.executeTakeFirstOrThrow()
		)
		return { ...result, key }
	}

	async deleteApiKey(ctx: Context, key: string): Promise<boolean> {
		const result = await this.write(ctx, db =>
			db
				.deleteFrom('api_key')
				.where('key', '=', key)
				.where('project_id', '=', ctx.project_id)
				.executeTakeFirstOrThrow()
		)
		return result.numDeletedRows > 0
	}

	async toggleApiKey(ctx: Context, key: string): Promise<boolean> {
		const result = await this.write(ctx, db =>
			db
				.updateTable('api_key')
				.where('key', '=', key)
				.where('project_id', '=', ctx.project_id)
				.set('is_active', sql`NOT is_active`)
				.executeTakeFirstOrThrow()
		)
		return result.numUpdatedRows > 0
	}
}
