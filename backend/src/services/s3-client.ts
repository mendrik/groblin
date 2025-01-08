import {
	S3Client as AwsS3,
	DeleteObjectCommand,
	GetObjectCommand
} from '@aws-sdk/client-s3'
import { injectable } from 'inversify'

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

	async getBytes(key: string) {
		return this.getBody(key).then(b => b.transformToByteArray())
	}
}
