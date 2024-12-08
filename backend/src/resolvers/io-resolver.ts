import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inject, injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import type { Json } from 'src/database/schema.ts'
import { Role } from 'src/enums.ts'
import { LogAccess } from 'src/middleware/log-access.ts'
import { Topic } from 'src/pubsub.ts'
import { IoService } from 'src/services/io-service.ts'
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

@InputType()
export class JsonArrayImportInput {
	@Field(type => Int)
	node_id: number

	@Field(type => String)
	data: string

	@Field(type => String)
	external_id: string

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

	@inject(IoService)
	private readonly io: IoService

	@Mutation(returns => Boolean)
	async importArray(
		@Arg('data', () => JsonArrayImportInput) payload: JsonArrayImportInput,
		@Ctx() { db, extra: user, pubSub }: Context
	) {
		const json: Json = await this.s3.getContent(payload.data).then(JSON.parse)
		const data = await db.transaction().execute(async trx => {
			this.io.ensureStructure(trx, payload.node_id, json)
		})
		pubSub.publish(Topic.NodesUpdated, true)
		pubSub.publish(Topic.ValuesUpdated, true)
		return true
	}

	@Mutation(returns => Upload)
	async uploadUrl(
		@Arg('filename', () => String) filename: string,
		@Ctx() { extra: user }: Context
	) {
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
