import { createHash } from 'node:crypto'
import { gunzipSync, gzipSync } from 'node:zlib'
import { projectArchiveSchema } from '@shared/project-archive.ts'
import { graphql } from 'graphql'
import { expect, test } from 'vitest'
import {
	confirmedImport,
	container,
	ctx,
	db,
	getBytes,
	getContent,
	schema,
	uploadBytes
} from '../../tests/resolver-context.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType, Role } from '../types.ts'
import { readContentSnapshot } from './content-revisions.ts'
import { ProjectArchiveService, validateArchive } from './project-archive.ts'
import { SchemaService } from './schema-service.ts'

const source = 'project_1/00000000-0000-0000-0000-000000000001'
const image = 'project_1/00000000-0000-0000-0000-000000000002'
const bytes = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a32sAAAAASUVORK5CYII=',
	'base64'
)
const service = () => container.get(ProjectArchiveService)
const create = async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.list })
		.where('id', '=', 11)
		.execute()
	getContent.mockResolvedValue(
		'[{"id":"a","title":"One","parts":[{"id":"p","label":"Child"}]}]'
	)
	await confirmedImport({
		node_id: 11,
		data: source,
		structure: true,
		external_id: 'id'
	})
	const photo = await container
		.get(NodeResolver)
		.insertNode(
			{ parent_id: 10, name: 'Photo', type: NodeType.media, order: 1 },
			undefined,
			ctx
		)
	await container.get(ValueResolver).upsertValue(
		{
			node_id: photo.id,
			expectedRevision: 0,
			value: {
				file: image,
				name: 'photo.png',
				contentType: 'image/png',
				size: bytes.length
			}
		},
		ctx
	)
	getBytes.mockResolvedValue(bytes)
	const exported = await service().exportData(ctx)
	return {
		exported,
		archive: projectArchiveSchema.parse(
			JSON.parse(gunzipSync(exported).toString())
		)
	}
}

test('archives round-trip nested lists, settings and media into a new owned unpublished project', async () => {
	const { exported, archive } = await create()
	expect(archive).toMatchObject({
		format: 'groblin-project',
		formatVersion: 1,
		media: [{ key: image, data: bytes.toString('base64') }]
	})
	const before = await readContentSnapshot(db, 1)
	getBytes.mockResolvedValue(exported)
	const preview = await service().previewImport(source, ctx)
	expect(preview).toMatchObject({
		name: 'One',
		mediaFiles: 1,
		mediaBytes: bytes.length
	})
	const result = await graphql({
		schema,
		source:
			'mutation($key: String!, $source: String!) { importProjectArchive(key: $key, expectedSource: $source, name: "Imported") }',
		variableValues: { key: source, source: preview.source },
		contextValue: ctx
	})
	expect(result.errors).toBeUndefined()
	const projectId = result.data?.importProjectArchive
	if (typeof projectId !== 'number')
		throw new Error('Missing imported project ID')
	expect(projectId).not.toBe(1)
	expect(await readContentSnapshot(db, 1)).toEqual(before)
	const imported = await readContentSnapshot(db, projectId)
	expect(imported.nodes.map(node => node.name)).toEqual(
		before.nodes.map(node => node.name)
	)
	expect(
		imported.values
			.filter(value => value.external_id !== null)
			.map(value => value.external_id)
	).toEqual(['a', 'p'])
	expect(
		imported.values.every(value =>
			(value.list_path ?? []).every(id =>
				imported.values.some(row => row.id === id)
			)
		)
	).toBe(true)
	const media = imported.values.find(
		value =>
			value.node_id === imported.nodes.find(node => node.name === 'Photo')?.id
	)
	expect(media?.value).toMatchObject({
		file: expect.stringMatching(new RegExp(`^project_${projectId}/`))
	})
	expect(uploadBytes).toHaveBeenCalledWith(
		expect.stringMatching(new RegExp(`^project_${projectId}/`)),
		bytes,
		{ ContentType: 'image/png' }
	)
	expect(
		await db
			.selectFrom('project')
			.select('published_revision_id')
			.where('id', '=', projectId)
			.executeTakeFirst()
	).toEqual({ published_revision_id: null })
	expect(
		await db
			.selectFrom('project_user')
			.select(['roles', 'owner'])
			.where('project_id', '=', projectId)
			.executeTakeFirst()
	).toEqual({ roles: [Role.Owner], owner: true })
	expect(
		await db
			.selectFrom('api_key')
			.select('key')
			.where('project_id', '=', projectId)
			.execute()
	).toEqual([])
	expect(
		await db.selectFrom('media_cleanup_job').select('id').execute()
	).toEqual([])
	const originalSchema = await container.get(SchemaService).getSchema(1)
	const importedSchema = await container.get(SchemaService).getSchema(projectId)
	const query = '{ Own { Title Parts { Label } } }'
	expect(
		(await graphql({ schema: importedSchema, source: query })).data
	).toEqual((await graphql({ schema: originalSchema, source: query })).data)
	getBytes.mockRejectedValue(new Error('Upload no longer available'))
	expect(
		await service().importProject(source, preview.source, 'Imported', ctx)
	).toBe(projectId)
	expect(await db.selectFrom('project').select('id').execute()).toHaveLength(3)
})

test('a storage failure rolls back the project and queues durable prefix cleanup', async () => {
	const { exported } = await create()
	getBytes.mockResolvedValue(exported)
	const preview = await service().previewImport(source, ctx)
	uploadBytes.mockRejectedValueOnce(new Error('Storage unavailable'))
	await expect(
		service().importProject(source, preview.source, 'Failed import', ctx)
	).rejects.toThrow('Storage unavailable')
	expect(await db.selectFrom('project').select('id').execute()).toHaveLength(2)
	expect(
		await db.selectFrom('project_import_receipt').select('project_id').execute()
	).toEqual([])
	expect(
		await db.selectFrom('media_cleanup_job').selectAll().execute()
	).toEqual([
		expect.objectContaining({
			prefix: expect.stringMatching(/^project_[0-9]+\/$/),
			not_before: expect.any(Date)
		})
	])
})

test('archive previews reject checksum mismatch, missing media, duplicate IDs and wrong scope', async () => {
	const { archive } = await create()
	const media = archive.media[0]
	if (!media) throw new Error('Missing fixture media')
	expect(() =>
		validateArchive({
			...archive,
			media: [{ ...media, sha256: '0'.repeat(64) }]
		})
	).toThrow('checksum')
	expect(() => validateArchive({ ...archive, media: [] })).toThrow(
		'missing referenced media'
	)
	expect(() => validateArchive({ ...archive, media: [media, media] })).toThrow(
		'duplicate media'
	)
	expect(() =>
		validateArchive({
			...archive,
			snapshot: {
				...archive.snapshot,
				nodes: [...archive.snapshot.nodes, ...archive.snapshot.nodes]
			}
		})
	).toThrow('duplicate IDs')
	expect(() =>
		validateArchive({
			...archive,
			snapshot: {
				...archive.snapshot,
				project: { ...archive.snapshot.project, id: 2 }
			}
		})
	).toThrow('foreign project')
	getBytes.mockResolvedValue(
		gzipSync(JSON.stringify({ ...archive, formatVersion: 2 }))
	)
	await expect(service().previewImport(source, ctx)).rejects.toThrow(
		'unsupported format'
	)
	getBytes.mockResolvedValue(Buffer.from('Not a gzip file'))
	await expect(service().previewImport(source, ctx)).rejects.toThrow(
		'Invalid project archive'
	)
})

test('archive import requires the reviewed bytes and Admin permission and export yields an expiring download', async () => {
	const { exported } = await create()
	getBytes.mockResolvedValue(exported)
	await expect(
		service().importProject(source, '0'.repeat(64), 'Changed', ctx)
	).rejects.toThrow('archive changed')
	getBytes.mockResolvedValue(bytes)
	const result = await graphql({
		schema,
		source: 'mutation { exportProject { filename bytes url } }',
		contextValue: ctx
	})
	expect(result.errors).toBeUndefined()
	expect(result.data?.exportProject).toMatchObject({
		filename: 'groblin-project-1.groblin.gz',
		url: expect.stringContaining('X-Amz-Expires=3600')
	})
	await db
		.updateTable('project_user')
		.set({ owner: false, roles: [Role.Editor] })
		.where('project_id', '=', 1)
		.execute()
	await expect(service().exportData(ctx)).rejects.toThrow('Not authorized')
	await expect(service().previewImport(source, ctx)).rejects.toThrow(
		'Not authorized'
	)
})

test('retrying an imported archive cannot recreate a deleted project or bypass a revoked session', async () => {
	const { exported } = await create()
	getBytes.mockResolvedValue(exported)
	const digest = createHash('sha256').update(exported).digest('hex')
	const id = await service().importProject(source, digest, 'Copy', ctx)
	await db.deleteFrom('project').where('id', '=', id).execute()
	await expect(
		service().importProject(source, digest, 'Copy', ctx)
	).rejects.toThrow('deleted')
	await db
		.updateTable('session')
		.set({ expiresAt: new Date(0) })
		.execute()
	await expect(
		service().importProject(source, digest, 'Copy', ctx)
	).rejects.toThrow('Not authorized')
})

test('archives include article images and remap their HTML references to the new project', async () => {
	const { exported } = await create()
	getBytes.mockResolvedValue(bytes)
	const article = await container
		.get(NodeResolver)
		.insertNode(
			{ parent_id: 10, name: 'Article', type: NodeType.article, order: 2 },
			undefined,
			ctx
		)
	await container.get(ValueResolver).upsertValue(
		{
			node_id: article.id,
			expectedRevision: 0,
			value: {
				content: `<p>Article<img src="/media/asset/${image}" alt="Photo"></p>`
			}
		},
		ctx
	)
	const archiveBytes = await service().exportData(ctx)
	getBytes.mockResolvedValue(archiveBytes)
	const preview = await service().previewImport(source, ctx)
	expect(preview.mediaFiles).toBe(1)
	const projectId = await service().importProject(
		source,
		preview.source,
		'Article copy',
		ctx
	)
	const snapshot = await readContentSnapshot(db, projectId)
	const imported = snapshot.values.find(
		row =>
			row.node_id === snapshot.nodes.find(node => node.name === 'Article')?.id
	)
	expect(imported?.value).toMatchObject({
		content: expect.stringContaining(`/media/asset/project_${projectId}/`),
		assets: [expect.stringContaining(`project_${projectId}/`)]
	})
	expect(JSON.stringify(imported?.value)).not.toContain('project_1/')
	expect(exported.length).toBeGreaterThan(0)
})
