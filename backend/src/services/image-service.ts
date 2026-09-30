import type { IncomingMessage, ServerResponse } from 'node:http'
import { S3Client as AwsS3, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { normalizeArticle } from '@shared/article-assets.ts'
import { assertExists, assertThat } from '@shared/asserts.ts'
import { contentSnapshotSchema } from '@shared/content-snapshot.ts'
import type { MediaType } from '@shared/json-value-types.ts'
import { decryptInteger, encryptInteger } from '@shared/utils/number-hash.ts'
import { url } from '@shared/utils/url.ts'
import { inject, injectable, optional } from 'inversify'
import { Kysely } from 'kysely'
import { uniq } from 'ramda'
import { included } from 'ramda-adjunct'
import sharp from 'sharp'
import type { DB } from 'src/database/schema.ts'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { ErrorHandler } from 'src/utils/error-handler.ts'
import { isJsonObject } from 'src/utils/json.ts'
import { Authenticator } from '../auth.ts'
import { signMedia, verifyMedia } from '../security/media-token.ts'
import { requireProjectFile } from '../security/project-access.ts'
import { MediaAssets } from './media-assets.ts'
import { S3Client } from './s3-client.ts'

const mediaUrl = process.env.VITE_MEDIA_URL ?? '/media'

export type MediaValue = Value & { value: MediaType }
type MediaSettings = {
	thumbnails: string[]
	required: boolean
}

type ValueWithSettings = {
	value: MediaType
	settings?: MediaSettings
}

@injectable()
export class ImageService {
	@inject(S3Client)
	private s3: S3Client

	@inject('S3SigningClient') @optional() private signing: AwsS3 | undefined
	@inject(AwsS3)
	private awsS3: AwsS3

	@inject(MediaAssets) private assets: MediaAssets
	@inject(Kysely)
	private db: Kysely<DB>

	@inject(Authenticator)
	private auth: Authenticator

	articleHtml(content: string, revision?: number) {
		return normalizeArticle(content, key => this.assets.mediaUrl(key, revision))
			.content
	}

	mediaUrl(
		value: Value & { value: MediaType },
		size?: string,
		revision?: number
	): string {
		const version = `${revision ? `${revision}:` : ''}${value.updated_at.getTime()}`
		const expires = String(Date.now() + 3600000)
		const token = signMedia(value.id, version, size ?? '', expires)
		return url`${mediaUrl}/${encryptInteger(value.id)}?size=${size}&revision=${revision}&updated_at=${version}&expires=${expires}&token=${token}`
	}

	@ErrorHandler()
	async handleRequest<I extends IncomingMessage, O extends ServerResponse<I>>(
		req: I,
		response: O
	) {
		assertExists(req.url, 'Request URL is missing')
		const url = new URL(
			req.url,
			process.env.BETTER_AUTH_URL ?? 'http://localhost:4001'
		)
		const size = url.searchParams.get('size') ?? undefined
		const idHash = url.pathname.split('/').pop()

		assertExists(idHash, 'Image ID is missing')
		const id = decryptInteger(idHash)

		const revisionInput = url.searchParams.get('revision')
		const revision = revisionInput === null ? undefined : Number(revisionInput)
		if (
			revision !== undefined &&
			(!Number.isSafeInteger(revision) || revision <= 0)
		)
			throw new Error('Invalid media revision')
		const res = revision
			? await this.archivedMedia(revision, id)
			: await this.db
					.selectFrom('values')
					.leftJoin('node_settings', 'values.node_id', 'node_settings.node_id')
					.select([
						'values.value',
						'values.project_id',
						'values.updated_at',
						eb => eb.ref('node_settings.settings').as('settings')
					])
					.where('values.id', '=', id)
					.executeTakeFirstOrThrow()

		const signed = verifyMedia(
			id,
			`${revision ? `${revision}:` : ''}${res.updated_at.getTime()}`,
			size ?? '',
			url.searchParams.get('expires') ?? '',
			url.searchParams.get('token') ?? ''
		)
		if (!signed) {
			const session = await this.auth.api.getSession({
				headers: new Headers({ cookie: req.headers.cookie ?? '' }),
				query: { disableCookieCache: true }
			})
			const membership =
				session &&
				(await this.db
					.selectFrom('project_user')
					.select('project_id')
					.where('project_id', '=', res.project_id)
					.where('user_id', '=', session.user.id)
					.where('confirmed', '=', true)
					.executeTakeFirst())
			if (!membership) {
				response.writeHead(403)
				response.end('Forbidden')
				return
			}
		}

		if (
			!isJsonObject(res.value) ||
			typeof res.value.file !== 'string' ||
			typeof res.value.name !== 'string' ||
			typeof res.value.contentType !== 'string' ||
			typeof res.value.size !== 'number'
		)
			throw new Error('Invalid media')
		const media: ValueWithSettings = {
			value: {
				file: res.value.file,
				name: res.value.name,
				contentType: res.value.contentType,
				size: res.value.size
			},
			settings: res.settings as MediaSettings | undefined
		}
		requireProjectFile(res.project_id, media.value.file)
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
		const s3Url = await getSignedUrl(this.signing ?? this.awsS3, getObj, {
			expiresIn: 3600
		})
		response.writeHead(302, {
			'Cache-Control': 'private, no-store',
			Location: s3Url
		})
		response.end()
	}

	private async archivedMedia(revisionId: number, valueId: number) {
		const revision = await this.db
			.selectFrom('content_revision')
			.select(['snapshot', 'project_id'])
			.where('id', '=', revisionId)
			.executeTakeFirstOrThrow()
		const snapshot = contentSnapshotSchema.parse(revision.snapshot)
		const value = snapshot.values.find(value => value.id === valueId)
		if (!value || value.project_id !== revision.project_id)
			throw new Error('Archived media not found')
		return {
			value: value.value,
			project_id: revision.project_id,
			updated_at: new Date(value.updated_at),
			settings:
				snapshot.settings.find(settings => settings.node_id === value.node_id)
					?.settings ?? null
		}
	}

	async createThumbnail(media: MediaType, size: string) {
		const [width, height] = size.includes('x')
			? size.split('x').map(Number)
			: [Number(size), Number(size)]
		if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= 4096))
			throw new Error('Invalid thumbnail dimensions')
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
}
