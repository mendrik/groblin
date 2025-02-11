import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { MediaType } from '@shared/json-value-types.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import { inject, injectable } from 'inversify'
import { T as _, assocPath } from 'ramda'
import { isString, resolveP } from 'ramda-adjunct'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { isJsonObject } from '../utils/json.ts'
import { S3Client } from './s3-client.ts'

const isImage = ({ value }: Value) =>
	isJsonObject(value) && isString(value.contentType)
		? value.contentType.startsWith('image/')
		: false

type MediaValue = Value & { value: MediaType }

@injectable()
export class ValueEnricher {
	@inject(S3Client)
	private readonly s3: S3Client

	private async appendS3Url(value: MediaValue): Promise<Value> {
		const command = new GetObjectCommand({
			Bucket: process.env.AWS_BUCKET,
			Key: value.value.file
		})
		const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 })
		return assocPath(['value', 'url'], url, value)
	}

	public enrichValue = match<[Value], Promise<Value>>(
		caseOf([isImage], v => this.appendS3Url(v as MediaValue)),
		caseOf([_], resolveP<Value>)
	)
}
