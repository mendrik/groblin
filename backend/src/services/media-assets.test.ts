import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import {
	S3Client as AwsS3,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand
} from '@aws-sdk/client-s3'
import { assetPath } from '@shared/article-assets.ts'
import { mockClient } from 'aws-sdk-client-mock'
import { graphql } from 'graphql'
import { Container } from 'inversify'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { container, ctx, db } from '../../tests/resolver-context.ts'
import { IoResolver } from '../resolvers/io-resolver.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType, Role } from '../types.ts'
import { mediaIsRetained } from './content-revisions.ts'
import { ImageService } from './image-service.ts'
import { buildInternalSchema } from './internal-schema.ts'
import { inspectMedia, MediaAssets } from './media-assets.ts'
import { S3Client } from './s3-client.ts'

const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a32sAAAAASUVORK5CYII=',
	'base64'
)
const aws = new AwsS3({
	region: 'eu-north-1',
	credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
})
const sdk = mockClient(aws)
let assets: MediaAssets
let child: Container
const input = {
	filename: 'photo.png',
	contentType: 'image/png',
	size: png.length,
	purpose: 'MEDIA'
} as const
const body = (bytes: Buffer) =>
	Object.assign(Readable.from([bytes]), {
		transformToWebStream: () =>
			new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(bytes)
					controller.close()
				}
			}),
		transformToByteArray: async () => new Uint8Array(bytes),
		transformToString: async () => bytes.toString()
	})
beforeEach(() => {
	sdk.reset()
	vi.stubEnv('AWS_BUCKET', 'test-bucket')
	sdk
		.on(HeadObjectCommand)
		.resolves({ ContentLength: png.length, ContentType: 'image/png' })
	sdk.on(GetObjectCommand).callsFake(() => ({ Body: body(png) }))
	sdk.on(PutObjectCommand).resolves({})
	sdk
		.on(ListObjectsV2Command)
		.callsFake(command => ({ Contents: [{ Key: command.Prefix }] }))
	sdk.on(DeleteObjectCommand).resolves({})
	child = new Container({ parent: container })
	child.bind(AwsS3).toConstantValue(aws)
	child.bind(S3Client).toSelf()
	child.bind(MediaAssets).toSelf()
	child.bind(ImageService).toSelf()
	child.bind(IoResolver).toSelf()
	assets = child.get(MediaAssets)
})
afterEach(() => vi.unstubAllEnvs())

test('upload finalization verifies metadata, seals immutable bytes, and exposes dimensions through the API', async () => {
	const upload = await assets.prepare(input, ctx)
	expect(upload.signedUrl).toContain('X-Amz-Expires=900')
	const result = await graphql({
		schema: buildInternalSchema(child),
		source:
			'mutation($key: String!) { finalizeUpload(key: $key) { file name contentType size width height } }',
		variableValues: { key: upload.object },
		contextValue: ctx
	})
	expect(result.errors).toBeUndefined()
	const media = result.data?.finalizeUpload
	expect(media).toMatchObject({
		name: 'photo.png',
		contentType: 'image/png',
		size: png.length,
		width: 1,
		height: 1
	})
	if (
		!media ||
		typeof media !== 'object' ||
		!('file' in media) ||
		typeof media.file !== 'string'
	)
		throw new Error('Missing finalized media')
	expect(media.file).not.toBe(upload.object)
	expect(sdk.commandCalls(PutObjectCommand)[0]?.args[0].input).toMatchObject({
		Key: media.file,
		Body: png,
		ContentType: 'image/png'
	})
	const finalized = await assets.finalize(upload.object, ctx)
	sdk
		.on(GetObjectCommand)
		.callsFake(() => ({ Body: body(Buffer.from('overwritten staged bytes')) }))
	expect(await assets.finalize(upload.object, ctx)).toEqual(finalized)
	expect(await assets.finalize(finalized.file, ctx)).toEqual(finalized)
	expect(sdk.commandCalls(PutObjectCommand)).toHaveLength(1)
	expect(
		await db.selectFrom('media_file_cleanup_job').select('key').execute()
	).toEqual([])
	await assets.requireFiles(db, 1, finalized)
	await expect(
		assets.requireFiles(db, 1, { ...finalized, size: 999 })
	).rejects.toThrow('metadata')
})

test('upload limits, role changes, wrong metadata, expired sources and unsupported files fail safely', async () => {
	await expect(
		assets.prepare({ ...input, size: 21 * 1024 * 1024 }, ctx)
	).rejects.toThrow()
	await expect(
		assets.prepare({ ...input, contentType: 'image/svg+xml' }, ctx)
	).rejects.toThrow()
	const upload = await assets.prepare(input, ctx)
	sdk
		.on(HeadObjectCommand)
		.resolves({ ContentLength: 2, ContentType: 'image/png' })
	await expect(assets.finalize(upload.object, ctx)).rejects.toThrow(
		'size or content type'
	)
	sdk
		.on(HeadObjectCommand)
		.resolves({ ContentLength: png.length, ContentType: 'image/png' })
	await db
		.updateTable('media_asset')
		.set({ expires_at: new Date(0) })
		.where('key', '=', upload.object)
		.execute()
	await expect(assets.finalize(upload.object, ctx)).rejects.toThrow('expired')
	await db
		.updateTable('project_user')
		.set({ owner: false, roles: [Role.Editor] })
		.where('project_id', '=', 1)
		.execute()
	await expect(
		assets.prepare({ ...input, purpose: 'PROJECT_IMPORT' }, ctx)
	).rejects.toThrow('Not authorized')
	await assets.prepare(input, ctx)
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer] })
		.where('project_id', '=', 1)
		.execute()
	await expect(assets.finalize(upload.object, ctx)).rejects.toThrow(
		'Not authorized'
	)
	expect(sdk.commandCalls(PutObjectCommand)).toHaveLength(0)
})

test('inspection rejects false image, PDF and UTF-8 declarations and accepts supported media', async () => {
	await expect(inspectMedia(png, 'image/jpeg')).rejects.toThrow(
		'type or dimensions'
	)
	await expect(
		inspectMedia(Buffer.from('image?'), 'image/png')
	).rejects.toThrow('supported image')
	await expect(
		inspectMedia(Buffer.from('pdf?'), 'application/pdf')
	).rejects.toThrow('not a PDF')
	await expect(inspectMedia(Buffer.from([255]), 'text/plain')).rejects.toThrow(
		'UTF-8'
	)
	await expect(inspectMedia(Buffer.alloc(0), 'text/plain')).rejects.toThrow(
		'20 MiB'
	)
	await expect(inspectMedia(png, 'image/svg+xml')).rejects.toThrow()
	await expect(
		inspectMedia(Buffer.from('safe'), 'application/x-active')
	).rejects.toThrow('Unsupported')
	expect(
		await inspectMedia(Buffer.from('%PDF-1.7'), 'application/pdf')
	).toEqual({})
	expect(await inspectMedia(Buffer.from('Häme'), 'text/plain')).toEqual({})
	expect(await inspectMedia(png, 'application/octet-stream')).toEqual({})
})

test('cleanup retains article images in history, retries storage failures, and removes unused uploads', async () => {
	const upload = await assets.prepare(input, ctx)
	const media = await assets.finalize(upload.object, ctx)
	await container
		.get(NodeResolver)
		.updateNode(
			{ id: 11, expectedRevision: 1, name: 'Own', type: NodeType.article },
			ctx
		)
	const saved = await container.get(ValueResolver).upsertValue(
		{
			node_id: 11,
			expectedRevision: 0,
			value: { content: `<img src="${assetPath(media.file)}" alt="Photo">` }
		},
		ctx
	)
	const value = await db
		.selectFrom('values')
		.selectAll()
		.where('id', '=', saved.id)
		.executeTakeFirstOrThrow()
	await container.get(ValueResolver).upsertValue(
		{
			id: saved.id,
			node_id: 11,
			expectedRevision: value.revision,
			value: { content: '<p>Removed image</p>' }
		},
		ctx
	)
	expect(await mediaIsRetained(db, 1, media.file)).toBe(true)
	await db
		.updateTable('media_asset')
		.set({ expires_at: new Date(0) })
		.execute()
	await assets.expire()
	expect(
		sdk.commandCalls(DeleteObjectCommand).map(call => call.args[0].input.Key)
	).toEqual([upload.object])
	expect(await db.selectFrom('media_asset').select('key').execute()).toEqual([
		{ key: media.file }
	])
	await db.deleteFrom('content_revision').where('project_id', '=', 1).execute()
	await db
		.updateTable('media_asset')
		.set({ expires_at: new Date(0) })
		.execute()
	sdk.on(DeleteObjectCommand).rejects(new Error('Storage unavailable'))
	await assets.expire()
	expect(
		await db
			.selectFrom('media_asset')
			.select(['cleanup_attempts', 'last_error'])
			.executeTakeFirst()
	).toMatchObject({ cleanup_attempts: 1, last_error: 'Storage unavailable' })
	sdk.on(DeleteObjectCommand).resolves({})
	await db
		.updateTable('media_asset')
		.set({ expires_at: new Date(0) })
		.execute()
	await assets.expire()
	expect(await db.selectFrom('media_asset').select('key').execute()).toEqual([])
})

test('signed article URLs work without a session and tampering or foreign assets is rejected', async () => {
	const upload = await assets.prepare(input, ctx)
	const media = await assets.finalize(upload.object, ctx)
	const server = createServer((req, res) => void assets.handleRequest(req, res))
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (!address || typeof address === 'string')
		throw new Error('Missing test address')
	const requestUrl = new URL(assets.mediaUrl(media.file))
	requestUrl.host = `127.0.0.1:${address.port}`
	try {
		expect((await fetch(requestUrl, { redirect: 'manual' })).status).toBe(302)
		requestUrl.searchParams.set('token', '0'.repeat(64))
		expect((await fetch(requestUrl, { redirect: 'manual' })).status).toBe(403)
		expect(
			(
				await fetch(
					`http://127.0.0.1:${address.port}/media/asset/project_2/00000000-0000-0000-0000-000000000001`
				)
			).status
		).toBe(403)
	} finally {
		await new Promise<void>((resolve, reject) =>
			server.close(error => (error ? reject(error) : resolve()))
		)
	}
	await expect(assets.requireFiles(db, 2, media)).rejects.toThrow(
		'Invalid upload'
	)
	await expect(
		assets.requireFiles(db, 1, { file: upload.object })
	).rejects.toThrow('verify the file')
})

test('public article HTML signs pinned revision images and remains valid after draft replacement', async () => {
	const upload = await assets.prepare(input, ctx)
	const media = await assets.finalize(upload.object, ctx)
	await container
		.get(NodeResolver)
		.updateNode(
			{ id: 11, expectedRevision: 1, name: 'Own', type: NodeType.article },
			ctx
		)
	const value = await container.get(ValueResolver).upsertValue(
		{
			node_id: 11,
			expectedRevision: 0,
			value: { content: `<img src="${assetPath(media.file)}" alt="Photo">` }
		},
		ctx
	)
	const revision = await db
		.selectFrom('content_revision')
		.select('id')
		.where('project_id', '=', 1)
		.orderBy('id', 'desc')
		.executeTakeFirstOrThrow()
	await container.get(ValueResolver).upsertValue(
		{
			id: value.id,
			node_id: 11,
			expectedRevision: value.revision,
			value: { content: '<p>New draft</p>' }
		},
		ctx
	)
	const image = child.get(ImageService)
	const html = image.articleHtml(
		`<img src="${assetPath(media.file)}" alt="Photo">`,
		revision.id
	)
	const signed = html.match(/src="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&')
	if (!signed) throw new Error('Missing signed article image')
	const server = createServer((req, res) => void assets.handleRequest(req, res))
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (!address || typeof address === 'string')
		throw new Error('Missing test address')
	const url = new URL(signed)
	url.host = `127.0.0.1:${address.port}`
	try {
		expect((await fetch(url, { redirect: 'manual' })).status).toBe(302)
	} finally {
		await new Promise<void>((resolve, reject) =>
			server.close(error => (error ? reject(error) : resolve()))
		)
	}
})

test('only expiring import uploads can be consumed as sources, and cleanup retries failed sealed writes', async () => {
	const source = await assets.prepare(
		{
			filename: 'data.json',
			contentType: 'application/json',
			size: 2,
			purpose: 'JSON_IMPORT'
		},
		ctx
	)
	await assets.requireSource(1, source.object, 'JSON_IMPORT', ctx.user.id)
	await expect(
		assets.requireSource(1, source.object, 'PROJECT_IMPORT', ctx.user.id)
	).rejects.toThrow('import upload')
	const upload = await assets.prepare(input, ctx)
	await expect(
		assets.requireSource(1, upload.object, 'JSON_IMPORT', ctx.user.id)
	).rejects.toThrow('import upload')
	sdk.on(PutObjectCommand).rejects(new Error('Write failed'))
	await expect(assets.finalize(upload.object, ctx)).rejects.toThrow(
		'Write failed'
	)
	const job = await db
		.selectFrom('media_file_cleanup_job')
		.selectAll()
		.executeTakeFirstOrThrow()
	expect(job.key).not.toBe(upload.object)
	sdk.on(DeleteObjectCommand).rejects(new Error('Cleanup failed'))
	await assets.expire()
	expect(
		await db.selectFrom('media_file_cleanup_job').selectAll().executeTakeFirst()
	).toMatchObject({ key: job.key, attempts: 1, last_error: 'Cleanup failed' })
	sdk.on(DeleteObjectCommand).resolves({})
	await db
		.updateTable('media_file_cleanup_job')
		.set({ not_before: new Date(0) })
		.execute()
	await assets.expire()
	expect(
		await db.selectFrom('media_file_cleanup_job').select('key').execute()
	).toEqual([])
})
