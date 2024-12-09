import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inject, injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { Json } from 'src/database/schema.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import { compareStructure } from 'src/services/json.ts'
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
}

@ObjectType()
export class Upload {
	@Field(type => String)
	signedUrl: string

	@Field(type => String)
	object: string
}

@injectable()
@UseMiddleware(LogAccess)
@Authorized(Role.Admin)
@Resolver()
export class IoResolver {
	@inject(S3Client)
	private readonly s3: S3Client

	@inject(NodeResolver)
	private readonly nodeResolver: NodeResolver

	@Mutation(returns => Boolean)
	async importArray(
		@Arg('data', () => JsonArrayImportInput) payload: JsonArrayImportInput,
		@Ctx() ctx: Context
	) {
		const { db, pubSub } = ctx
		const json: Json = await this.s3.getContent(payload.data).then(JSON.parse)
		const node = await this.nodeResolver.getTreeNode(ctx, payload.node_id)
		const diffs = [...compareStructure(node, json, '', payload.external_id)]
		await db
			.transaction()
			.execute(async trx => {
				diffs.forEach(diff =>
					this.nodeResolver.insertNodeTrx(
						trx,
						{
							name: diff.key,
							order: diff.parent.nodes.length,
							type: diff.type,
							parent_id: diff.parent.id
						},
						ctx
					)
				)
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
