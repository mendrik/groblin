import { S3Client as AwsS3, GetObjectCommand } from '@aws-sdk/client-s3'
import { injectable } from 'inversify'

@injectable()
export class S3Client extends AwsS3 {
	constructor() {
		super({ region: process.env.AWS_REGION })
	}

	async getContent(Key: string) {
		const response = await this.send(
			new GetObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key
			})
		)
		if (response.Body === undefined) {
			throw new Error('No body in response')
		}
		return response.Body.transformToString()
	}
}
