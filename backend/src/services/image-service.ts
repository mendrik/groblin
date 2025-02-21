import type { IncomingMessage, ServerResponse } from 'node:http'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { assertExists, assertThat } from '@shared/asserts.ts'
import type { MediaType } from '@shared/json-value-types.ts'
import { decryptInteger, encryptInteger } from '@shared/utils/number-hash.ts'
import { url } from '@shared/utils/url.ts'
import type { AnyFn } from '@tp/functions.ts'
import { inject, injectable } from 'inversify'
import { Kysely } from 'kysely'
import { append, defaultTo, fromPairs, map, pipe, uniq } from 'ramda'
import { included, isString } from 'ramda-adjunct'
import sharp from 'sharp'
import type { DB } from 'src/database/schema.ts'
import { NodeResolver } from 'src/resolvers/node-resolver.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { NodeType } from 'src/types.ts'
import { Topic } from 'src/types.ts'
import { ErrorHandler } from 'src/utils/error-handler.ts'
import { isJsonObject } from 'src/utils/json.ts'
import type { PubSub } from 'type-graphql'
import { S3Client } from './s3-client.ts'

const mediaUrl = process.env.VITE_MEDIA_URL

export type MediaValue = Value & { value: MediaType }
type MediaSettings = {
	thumbnails: string[]
	required: boolean
}

type ValueWithSettings = {
	value: MediaType
	settings?: MediaSettings
}

type NodeWithSettings = {
	type: NodeType
	settings?: MediaSettings
}

@injectable()
export class ImageService {
	@inject('PubSub')
	private pubSub: PubSub

	@inject(NodeResolver)
	private nodeResolver: NodeResolver

	@inject(S3Client)
	private s3: S3Client

	@inject(Kysely)
	private db: Kysely<DB>

	init() {
		void this.waitForImageReplacement()
	}

	async waitForImageReplacement() {
		console.log('Waiting for image replacement')
		for await (const value of this.pubSub.subscribe(
			Topic.ValueDeleted
		) as AsyncIterable<Value>) {
			const res = await this.db
				.selectFrom('node')
				.leftJoin('node_settings', 'node.id', 'node_settings.node_id')
				.select([
					'node.type',
					eb => eb.ref('node_settings.settings').as('settings')
				])
				.where('node.id', '=', value.node_id)
				.executeTakeFirstOrThrow()
			const node = res as NodeWithSettings
			if (
				node.type === NodeType.media &&
				isJsonObject(value.value) &&
				isString(value.value.file)
			) {
				this.s3.deleteFile(value.value.file)
				const thumbails: string[] = uniq(
					['640'].concat(node.settings?.thumbnails ?? [])
				)
				for await (const size of thumbails) {
					await this.s3.deleteFile(`${value.value.file}_${size}`)
				}
			}
		}
	}

	mediaUrl(value: Value & { value: MediaType }, size?: string): string {
		return url`${mediaUrl}/${encryptInteger(value.id)}?size=${size}&updated_at=${value.updated_at.getTime()}`
	}

	@ErrorHandler()
	async handleRequest<I extends IncomingMessage, O extends ServerResponse<I>>(
		req: I,
		response: O
	) {
		assertExists(req.url, 'Request URL is missing')
		const url = new URL(req.url, mediaUrl)
		const size = url.searchParams.get('size') ?? undefined
		const idHash = url.pathname.split('/').pop()

		assertExists(idHash, 'Image ID is missing')
		const id = decryptInteger(idHash)

		const res = await this.db
			.selectFrom('values')
			.leftJoin('node_settings', 'values.node_id', 'node_settings.node_id')
			.select([
				'values.value',
				eb => eb.ref('node_settings.settings').as('settings')
			])
			.where('values.id', '=', id)
			.executeTakeFirstOrThrow()

		const media = res as ValueWithSettings
		const thumbails: string[] = uniq(
			['640'].concat(media.settings?.thumbnails ?? [])
		)
		if (size) {
			assertThat(included(thumbails), size, 'Invalid size')
		}
		if (
			size &&
			media.value.contentType.startsWith('image') &&
			!(await this.imageExists(media.value, size))
		) {
			await this.createThumbnail(media.value, size)
		}
		const getObj = new GetObjectCommand({
			Bucket: process.env.AWS_BUCKET,
			Key: size ? this.thumbnailFile(media.value, size) : media.value.file
		})
		const s3Url = await getSignedUrl(this.s3, getObj, {
			expiresIn: 3600
		})
		response.writeHead(302, {
			'Access-Control-Allow-Origin': '*',
			Location: s3Url
		})
		response.end()
	}

	async createThumbnail(media: MediaType, size: string) {
		const [width, height] = size.includes('x')
			? size.split('x').map(Number)
			: [Number(size), Number(size)]
		const image = await this.s3.getBytes(media.file)
		const resizedImage = await sharp(image)
			.resize({
				width,
				height,
				fit: sharp.fit.inside, // Ensures the image fits within the specified dimensions
				withoutEnlargement: true // Prevents enlarging the image if it's smaller than the specified dimensions
			})
			.webp({ quality: Number(process.env.THUMB_QUALITY ?? 80) })
			.toBuffer()
		const targetFile = this.thumbnailFile(media, size)
		await this.s3.uploadBytes(targetFile, resizedImage, {
			ContentType: 'image/webp',
			ContentDisposition: `inline; filename="${media.name}"`,
			Metadata: {
				filename: media.name
			}
		})
	}

	async imageExists(media: MediaType, size: string): Promise<boolean> {
		return this.s3.exists(this.thumbnailFile(media, size))
	}

	thumbnailFile(media: MediaType, size: string): string {
		return `${media.file}_${size}`
	}

	async getImageSet(media: MediaValue): Promise<Record<string, string>> {
		const res = await this.db
			.selectFrom('node_settings')
			.select('settings')
			.where('node_id', '=', media.node_id)
			.executeTakeFirst()
		const settings = res as MediaSettings | undefined

		const thumbailMap: (sizes?: string[]) => Record<string, string> = pipe(
			defaultTo([]),
			append('640'),
			uniq,
			map((size: string) => [`url_${size}`, this.mediaUrl(media, size)]),
			fromPairs as AnyFn
		)

		return {
			url: this.mediaUrl(media),
			...thumbailMap(settings?.thumbnails)
		}
	}
}
