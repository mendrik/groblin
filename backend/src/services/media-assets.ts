import { createHash, randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
	S3Client as AwsS3,
	GetObjectCommand,
	PutObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { contentAssetKeys } from '@shared/article-assets.ts'
import { mediaValueSchema } from '@shared/content.ts'
import { contentSnapshotSchema } from '@shared/content-snapshot.ts'
import type { MediaType } from '@shared/json-value-types.ts'
import { type UploadInput, uploadInputSchema } from '@shared/media-upload.ts'
import { GraphQLError } from 'graphql'
import { inject, injectable, optional } from 'inversify'
import { Kysely, type Selectable } from 'kysely'
import sharp, { type Metadata } from 'sharp'
import { Authenticator } from '../auth.ts'
import type { DB, MediaAsset } from '../database/schema.ts'
import { signMedia, verifyMedia } from '../security/media-token.ts'
import { requireProjectFile } from '../security/project-access.ts'
import { requireProjectRole } from '../security/require-role.ts'
import { type Context, Role } from '../types.ts'
import { mediaIsRetained } from './content-revisions.ts'
import { lockProject } from './model-validation.ts'
import { S3Client } from './s3-client.ts'

const invalid = (message: string): never => {
	throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}
const content = (row: Selectable<MediaAsset>): MediaType =>
	mediaValueSchema.parse({
		file: row.key,
		name: row.filename,
		contentType: row.content_type,
		size: row.size,
		...(row.width && row.height ? { width: row.width, height: row.height } : {})
	})
export async function inspectMedia(bytes: Buffer, type: string) {
	if (!bytes.length || bytes.length > 20 * 1024 * 1024)
		return invalid('Media must be between 1 byte and 20 MiB')
	if (type.startsWith('image/')) {
		let metadata: Metadata
		try {
			metadata = await sharp(bytes, { limitInputPixels: 40000000 }).metadata()
		} catch {
			return invalid('The uploaded file is not a supported image')
		}
		const actual = new Map([
			['jpeg', 'image/jpeg'],
			['png', 'image/png'],
			['webp', 'image/webp'],
			['gif', 'image/gif'],
			['avif', 'image/avif'],
			['heif', 'image/avif']
		]).get(metadata.format ?? '')
		if (
			actual !== type ||
			!metadata.width ||
			!metadata.height ||
			metadata.width > 16384 ||
			metadata.height > 16384
		)
			return invalid('Image type or dimensions do not match the upload')
		return { width: metadata.width, height: metadata.height }
	}
	if (type === 'application/pdf' && bytes.subarray(0, 5).toString() !== '%PDF-')
		return invalid('The file is not a PDF')
	if (type === 'text/plain') {
		try {
			new TextDecoder('utf-8', { fatal: true }).decode(bytes)
		} catch {
			return invalid('Text uploads must contain UTF-8 text')
		}
	}
	if (
		!['application/pdf', 'text/plain', 'application/octet-stream'].includes(
			type
		)
	)
		return invalid('Unsupported media type')
	return {}
}

@injectable()
export class MediaAssets {
	@inject(Kysely) private db: Kysely<DB>
	@inject(S3Client) private storage: S3Client
	@inject('S3SigningClient') @optional() private signing: AwsS3 | undefined
	@inject(AwsS3) private aws: AwsS3
	@inject(Authenticator) private auth: Authenticator

	async prepare(input: UploadInput, ctx: Context) {
		const data = uploadInputSchema.parse(input)
		const key = `project_${ctx.project_id}/${randomUUID()}`
		await this.db.transaction().execute(async trx => {
			await lockProject(trx, ctx.project_id)
			await requireProjectRole(
				trx,
				ctx,
				data.purpose === 'PROJECT_IMPORT'
					? [Role.Admin]
					: [Role.Admin, Role.Editor]
			)
			await trx
				.insertInto('media_asset')
				.values({
					key,
					project_id: ctx.project_id,
					uploaded_by: ctx.user.id,
					filename: data.filename,
					content_type: data.contentType,
					size: data.size,
					purpose: data.purpose
				})
				.execute()
		})
		return {
			object: key,
			signedUrl: await getSignedUrl(
				this.signing ?? this.aws,
				new PutObjectCommand({
					Bucket: process.env.AWS_BUCKET,
					Key: key,
					ContentType: data.contentType,
					ContentLength: data.size,
					Metadata: { uploadedBy: ctx.user.id }
				}),
				{ expiresIn: 900 }
			)
		}
	}

	async finalize(key: string, ctx: Context): Promise<MediaType> {
		requireProjectFile(ctx.project_id, key)
		await requireProjectRole(this.db, ctx, [Role.Admin, Role.Editor])
		const sealed = `project_${ctx.project_id}/${randomUUID()}`
		await this.db
			.insertInto('media_file_cleanup_job')
			.values({ key: sealed })
			.execute()
		try {
			return await this.db.transaction().execute(async trx => {
				await trx
					.selectFrom('media_file_cleanup_job')
					.select('key')
					.where('key', '=', sealed)
					.forUpdate()
					.executeTakeFirstOrThrow()
				await lockProject(trx, ctx.project_id)
				await requireProjectRole(trx, ctx, [Role.Admin, Role.Editor])
				const upload = await trx
					.selectFrom('media_asset')
					.selectAll()
					.where('key', '=', key)
					.where('project_id', '=', ctx.project_id)
					.forUpdate()
					.executeTakeFirst()
				if (upload?.purpose !== 'MEDIA')
					return invalid('Choose a media upload from this project')
				if (upload.sealed_key || upload.verified_at) {
					const result = upload.sealed_key
						? await trx
								.selectFrom('media_asset')
								.selectAll()
								.where('key', '=', upload.sealed_key)
								.where('project_id', '=', ctx.project_id)
								.executeTakeFirstOrThrow()
						: upload
					await trx
						.deleteFrom('media_file_cleanup_job')
						.where('key', '=', sealed)
						.execute()
					return content(result)
				}
				if (
					upload.uploaded_by !== ctx.user.id ||
					upload.expires_at.getTime() <= Date.now()
				)
					return invalid('This upload is expired or belongs to another account')
				const metadata = await this.storage.metadata(key)
				if (
					metadata.ContentLength !== upload.size ||
					metadata.ContentType !== upload.content_type
				)
					return invalid(
						'Uploaded size or content type does not match the review'
					)
				const bytes = await this.storage.getBytes(key, 20 * 1024 * 1024)
				if (bytes.length !== upload.size)
					return invalid('Uploaded bytes do not match the declared size')
				const dimensions = await inspectMedia(bytes, upload.content_type)
				const checksum = createHash('sha256').update(bytes).digest('hex')
				await this.storage.uploadBytes(sealed, bytes, {
					ContentType: upload.content_type,
					ContentDisposition: upload.content_type.startsWith('image/')
						? 'inline'
						: 'attachment'
				})
				const row = await trx
					.insertInto('media_asset')
					.values({
						key: sealed,
						project_id: ctx.project_id,
						uploaded_by: ctx.user.id,
						filename: upload.filename,
						content_type: upload.content_type,
						size: upload.size,
						purpose: 'MEDIA',
						verified_at: new Date(),
						sha256: checksum,
						...dimensions
					})
					.returningAll()
					.executeTakeFirstOrThrow()
				await trx
					.updateTable('media_asset')
					.set({ sealed_key: sealed })
					.where('key', '=', key)
					.execute()
				await trx
					.deleteFrom('media_file_cleanup_job')
					.where('key', '=', sealed)
					.execute()
				return content(row)
			})
		} catch (error) {
			await this.db
				.updateTable('media_file_cleanup_job')
				.set({ not_before: new Date() })
				.where('key', '=', sealed)
				.execute()
			throw error
		}
	}

	async requireSource(
		projectId: number,
		key: string,
		purpose: 'JSON_IMPORT' | 'PROJECT_IMPORT',
		userId: string
	) {
		requireProjectFile(projectId, key)
		const source = await this.db
			.selectFrom('media_asset')
			.select('key')
			.where('key', '=', key)
			.where('project_id', '=', projectId)
			.where('purpose', '=', purpose)
			.where('uploaded_by', '=', userId)
			.where('expires_at', '>', new Date())
			.executeTakeFirst()
		if (!source)
			return invalid('Choose an unexpired import upload owned by your account')
	}

	async requireFiles(db: Kysely<DB>, projectId: number, value: unknown) {
		for (const key of contentAssetKeys(value)) {
			requireProjectFile(projectId, key)
			const asset = await db
				.selectFrom('media_asset')
				.select(['key', 'content_type', 'size', 'width', 'height'])
				.where('key', '=', key)
				.where('project_id', '=', projectId)
				.where('purpose', '=', 'MEDIA')
				.where('verified_at', 'is not', null)
				.where('sealed_key', 'is', null)
				.executeTakeFirst()
			if (!asset)
				return invalid('Upload and verify the file before using it in content')
			if (
				typeof value === 'object' &&
				value &&
				'file' in value &&
				'size' in value &&
				'contentType' in value &&
				(value.size !== asset.size || value.contentType !== asset.content_type)
			)
				return invalid('Content metadata does not match the verified file')
			if (
				typeof value === 'object' &&
				value &&
				'assets' in value &&
				!asset.content_type.startsWith('image/')
			)
				return invalid('Articles require image assets')
		}
	}

	mediaUrl(key: string, revision?: number) {
		const expires = String(Date.now() + 3600000)
		const version = String(revision ?? '')
		const token = signMedia(key, version, '', expires)
		return `${process.env.VITE_MEDIA_URL ?? '/media'}/asset/${key}?revision=${revision ?? ''}&expires=${expires}&token=${token}`
	}

	async handleRequest(req: IncomingMessage, res: ServerResponse) {
		try {
			const url = new URL(
				req.url ?? '',
				process.env.BETTER_AUTH_URL ?? 'http://localhost:4001'
			)
			const key = url.pathname.replace(/^\/media\/asset\//, '')
			const asset = await this.db
				.selectFrom('media_asset')
				.selectAll()
				.where('key', '=', key)
				.where('verified_at', 'is not', null)
				.where('sealed_key', 'is', null)
				.executeTakeFirstOrThrow()
			requireProjectFile(asset.project_id, key)
			const revision = url.searchParams.get('revision') ?? ''
			const signed = verifyMedia(
				key,
				revision,
				'',
				url.searchParams.get('expires') ?? '',
				url.searchParams.get('token') ?? ''
			)
			if (signed && revision) {
				const row = await this.db
					.selectFrom('content_revision')
					.select('snapshot')
					.where('id', '=', Number(revision))
					.where('project_id', '=', asset.project_id)
					.executeTakeFirstOrThrow()
				if (
					!contentSnapshotSchema
						.parse(row.snapshot)
						.values.some(value => contentAssetKeys(value.value).includes(key))
				)
					throw new Error('Asset not in revision')
			} else if (!signed) {
				const session = await this.auth.api.getSession({
					headers: new Headers({ cookie: req.headers.cookie ?? '' }),
					query: { disableCookieCache: true }
				})
				const member =
					session &&
					(await this.db
						.selectFrom('project_user')
						.select('project_id')
						.where('user_id', '=', session.user.id)
						.where('project_id', '=', asset.project_id)
						.where('confirmed', '=', true)
						.executeTakeFirst())
				if (!member) throw new Error('Not authorized')
			}
			const target = await getSignedUrl(
				this.signing ?? this.aws,
				new GetObjectCommand({
					Bucket: process.env.AWS_BUCKET,
					Key: key,
					ResponseContentDisposition: asset.content_type.startsWith('image/')
						? 'inline'
						: 'attachment',
					ResponseContentType: asset.content_type
				}),
				{ expiresIn: 3600 }
			)
			res.writeHead(302, {
				'Cache-Control': 'private, no-store',
				'X-Content-Type-Options': 'nosniff',
				Location: target
			})
			res.end()
		} catch {
			res.writeHead(403)
			res.end('Forbidden')
		}
	}

	async expire() {
		const assets = await this.db
			.selectFrom('media_asset')
			.select(['key', 'project_id'])
			.where('expires_at', '<=', new Date())
			.orderBy('expires_at')
			.limit(25)
			.execute()
		for (const asset of assets)
			await this.db.transaction().execute(async trx => {
				await lockProject(trx, asset.project_id)
				const row = await trx
					.selectFrom('media_asset')
					.selectAll()
					.where('key', '=', asset.key)
					.where('expires_at', '<=', new Date())
					.forUpdate()
					.skipLocked()
					.executeTakeFirst()
				if (!row) return
				try {
					if (!(await mediaIsRetained(trx, row.project_id, row.key))) {
						await this.storage.deleteFileAndThumbnails(row.key)
						await trx
							.deleteFrom('media_asset')
							.where('key', '=', row.key)
							.execute()
					} else
						await trx
							.updateTable('media_asset')
							.set({ expires_at: new Date(Date.now() + 86400000) })
							.where('key', '=', row.key)
							.execute()
				} catch (error) {
					await trx
						.updateTable('media_asset')
						.set({
							cleanup_attempts: row.cleanup_attempts + 1,
							last_error:
								error instanceof Error
									? error.message.slice(0, 500)
									: 'Cleanup failed',
							expires_at: new Date(
								Date.now() +
									Math.min(
										3600000,
										60000 * 2 ** Math.min(row.cleanup_attempts, 6)
									)
							)
						})
						.where('key', '=', row.key)
						.execute()
				}
			})
		for (let count = 0; count < 25; count++) {
			const found = await this.db.transaction().execute(async trx => {
				const job = await trx
					.selectFrom('media_file_cleanup_job')
					.selectAll()
					.where('not_before', '<=', new Date())
					.orderBy('not_before')
					.forUpdate()
					.skipLocked()
					.executeTakeFirst()
				if (!job) return false
				try {
					const projectId = Number(job.key.match(/^project_([0-9]+)\//)?.[1])
					if (await mediaIsRetained(trx, projectId, job.key))
						throw new Error('Referenced asset cannot be removed')
					await this.storage.deleteFileAndThumbnails(job.key)
					await trx
						.deleteFrom('media_file_cleanup_job')
						.where('key', '=', job.key)
						.execute()
				} catch (error) {
					await trx
						.updateTable('media_file_cleanup_job')
						.set({
							attempts: job.attempts + 1,
							not_before: new Date(
								Date.now() +
									Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6))
							),
							last_error:
								error instanceof Error
									? error.message.slice(0, 500)
									: 'Cleanup failed'
						})
						.where('key', '=', job.key)
						.execute()
				}
				return true
			})
			if (!found) return
		}
	}
}
