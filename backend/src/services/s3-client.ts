import {
	S3Client as AwsS3,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand
} from '@aws-sdk/client-s3'
import { injectable } from 'inversify'
import { F, T } from 'ramda'

@injectable()
export class S3Client extends AwsS3 {
	constructor() {
		super({ region: process.env.AWS_REGION })
	}

	async getBody(key: string) {
		const response = await this.send(
			new GetObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		)
		if (response.Body === undefined) {
			throw new Error('No body in response')
		}
		return response.Body
	}

	async getContent(key: string) {
		return this.getBody(key).then(b => b.transformToString())
	}

	async deleteFile(key: string) {
		const response = await this.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		)
		return response
	}

	async exists(key: string) {
		return await this.send(
			new HeadObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		).then(T).catch(F)
	}

	async getBytes(key: string) {
		return this.getBody(key).then(b => b.transformToByteArray())
	}

	async uploadBytes(key: string, data: Buffer, metadata: Record<string, string>) {
		return await this.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key,
				Body: data,
				Metadata: metadata
			})
		)
	}
}
