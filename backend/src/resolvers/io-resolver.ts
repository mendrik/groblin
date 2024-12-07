import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { injectable } from 'inversify'
import type { Context } from 'src/context.ts'
import { Role } from 'src/enums.ts'
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
@Authorized(Role.Admin, Role.Viewer)
@Resolver()
export class IoResolver {
	@Mutation(returns => Boolean)
	async importArray(
		@Arg('data', () => JsonArrayImportInput) data: JsonArrayImportInput,
		@Ctx() { db, extra: user, pubSub }: Context
	) {
		console.log('import array', data.data)
		pubSub.publish(Topic.NodesUpdated, true)
		pubSub.publish(Topic.ValuesUpdated, true)
		return true
	}

	@Mutation(returns => Upload)
	async uploadUrl(
		@Arg('filename', () => String) filename: string,
		@Ctx() { extra: user }: Context
	) {
		const client = new S3Client({ region: process.env.AWS_REGION })
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
			signedUrl: getSignedUrl(client, command, { expiresIn: 3600 }),
			object: Key
		}
	}
}
