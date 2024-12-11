import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { pluckPath } from '@shared/utils/pluck-path.ts'
import { capitalize } from '@shared/utils/ramda.ts'
import { inject, injectable } from 'inversify'
import { type Transaction, sql } from 'kysely'
import { pipe, uniq } from 'ramda'
import type { Context } from 'src/context.ts'
import type { DB, JsonArray } from 'src/database/schema.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import {
	type Difference,
	compareStructure,
	dbValues
} from 'src/services/json.ts'
import { S3Client } from 'src/services/s3-client.ts'
import {
	Arg,
	Authorized,
	Ctx,
	Field,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Resolver,
	UseMiddleware
} from 'type-graphql'
import { v4 as uuid } from 'uuid'
import { NodeResolver } from './node-resolver.ts'

@InputType()
export class JsonArrayImportInput {
	@Field(type => Int)
	node_id: number

	@Field(type => String)
	data: string

	@Field(type => String, { nullable: true })
	external_id: string | undefined

	@Field(type => Boolean)
	structure: boolean

	@Field(type => [Int], { nullable: true })
	list_path: number[] | null
}

@ObjectType()
export class Upload {
	@Field(type => String)
	signedUrl: string

	@Field(type => String)
	object: string
}

const pluckParentIds = (l: Difference[]) =>
	pluckPath(['parent', 'id'] as const, l)

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin)
@Resolver()
export class IoResolver {
	@inject(S3Client)
	private readonly s3: S3Client

	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	async applyOrder(trx: Transaction<DB>, parentIds: number[]) {
		sql`
			WITH ordered_nodes AS (
				SELECT
					id,
					parent_id,
					ROW_NUMBER() OVER (PARTITION BY parent_id ORDER BY 'order', id) - 1 AS new_order
				FROM node WHERE parent_id IN (${parentIds.join(',')})
			)
			UPDATE node SET "order" = ordered_nodes.new_order FROM ordered_nodes 
			WHERE node.id = ordered_nodes.id;
		`.execute(trx)
	}

	@Mutation(returns => Boolean)
	async importArray(
		@Arg('data', () => JsonArrayImportInput) payload: JsonArrayImportInput,
		@Ctx() ctx: Context
	) {
		const { db, pubSub } = ctx
		const { node_id, external_id, data } = payload
		const json: JsonArray = await this.s3.getContent(data).then(JSON.parse)
		const node = await this.nodeResolver.getTreeNode(ctx, node_id)
		const missingNodes = [...compareStructure(node, json, '', external_id)]
		const newValues = [...dbValues(node, json, payload)]
		const parentIds = pipe(pluckParentIds, uniq)(missingNodes)
		const newNodes = missingNodes.map(diff => ({
			name: capitalize(diff.key),
			order: 0,
			type: diff.type,
			parent_id: diff.parent.id,
			project_id: ctx.extra.lastProjectId
		}))

		await db
			.transaction()
			.execute(async trx => {
				await trx.insertInto('node').values(newNodes).returning('id').execute()
				await this.applyOrder(trx, parentIds)
				await trx.insertInto('values').values(newValues).execute()
			})
			.catch(cause => {
				throw new Error(`Failed to import data: ${cause.message}`, { cause })
			})

		pubSub.publish(Topic.NodesUpdated, true)
		pubSub.publish(Topic.ValuesUpdated, true)
		return true
	}

	@Mutation(returns => Upload)
	async uploadUrl(
		@Arg('filename', () => String) filename: string,
		@Ctx() ctx: Context
	) {
		const { extra: user } = ctx
		const Key = `project_${user.lastProjectId}/${uuid()}`
		const command = new PutObjectCommand({
			Metadata: {
				uploadedBy: user.email,
				filename
			},
			Bucket: process.env.AWS_BUCKET,
			Key
		})
		return {
			signedUrl: getSignedUrl(this.s3, command, { expiresIn: 3600 }),
			object: Key
		}
	}
}
