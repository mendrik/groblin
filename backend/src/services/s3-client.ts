import {
	S3Client as AwsS3,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
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

	async getBytes(key: string, maxBytes = 20 * 1024 * 1024) {
		const body = await this.getBody(key)
		const reader = body.transformToWebStream().getReader()
		const chunks: Uint8Array[] = []
		let size = 0
		try {
			while (true) {
				const next = await reader.read()
				if (next.done) break
				size += next.value.byteLength
				if (size > maxBytes) throw new Error('Import is too large')
				chunks.push(next.value)
			}
		} finally {
			await reader.cancel()
			reader.releaseLock()
		}
		return Buffer.concat(chunks)
	}

	deleteFile(key: string) {
		return this.s3.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET,
				Key: key
			})
		)
	}

	async deleteFileAndThumbnails(key: string) {
		let continuationToken: string | undefined
		do {
			const page = await this.s3.send(
				new ListObjectsV2Command({
					Bucket: process.env.AWS_BUCKET,
					Prefix: key,
					ContinuationToken: continuationToken
				})
			)
			const keys = (page.Contents ?? []).flatMap(object =>
				object.Key && (object.Key === key || object.Key.startsWith(`${key}_`))
					? [object.Key]
					: []
			)
			for (const objectKey of keys) await this.deleteFile(objectKey)
			continuationToken = page.IsTruncated
				? page.NextContinuationToken
				: undefined
		} while (continuationToken)
	}

	async deleteProjectPrefix(prefix: string) {
		if (!/^project_[1-9][0-9]*\/$/.test(prefix))
			throw new Error('Invalid project prefix')
		let continuationToken: string | undefined
		do {
			const page = await this.s3.send(
				new ListObjectsV2Command({
					Bucket: process.env.AWS_BUCKET,
					Prefix: prefix,
					ContinuationToken: continuationToken
				})
			)
			for (const object of page.Contents ?? [])
				if (object.Key?.startsWith(prefix)) await this.deleteFile(object.Key)
			if (page.IsTruncated && !page.NextContinuationToken)
				throw new Error('Incomplete storage listing')
			continuationToken = page.IsTruncated
				? page.NextContinuationToken
				: undefined
		} while (continuationToken)
	}

	exists(key: string) {
		return this.s3
			.send(
				new HeadObjectCommand({
					Bucket: process.env.AWS_BUCKET,
					Key: key
				})
			)
			.then(T)
			.catch(F)
	}

	async getContent(key: string, maxBytes = 10 * 1024 * 1024) {
		return (await this.getBytes(key, maxBytes)).toString('utf8')
	}

	async metadata(key: string) {
		return this.s3.send(
			new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key })
		)
	}

	uploadBytes(
		key: string,
		data: Buffer,
		params: Partial<PutObjectRequest> = {}
	) {
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
