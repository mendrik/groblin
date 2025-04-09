import {
	S3Client as AwsS3,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	type PutObjectRequest
} from '@aws-sdk/client-s3'
import { inject, injectable } from 'inversify'
import { F, T } from 'ramda'

@injectable()
export class S3Client {

	@inject(AwsS3)
	private s3: AwsS3

	async getBody(key: string) {
		const response = await this.s3.send(
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

	getContent(key: string) {
		return this.getBody(key).then(b => b.transformToString())
	}

	deleteFile(key: string) {
		return this.s3.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		)
	}

	exists(key: string) {
		return this.s3.send(
			new HeadObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		)
			.then(T)
			.catch(F)
	}

	getBytes(key: string) {
		return this.getBody(key).then(b => b.transformToByteArray())
	}

	uploadBytes(key: string, data: Buffer, params: Partial<PutObjectRequest>) {
		return this.s3.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key,
				Body: data,
				...params
			})
		)
	}
}
