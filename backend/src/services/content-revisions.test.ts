import { contentSnapshotSchema } from '@shared/content-snapshot.ts'
import { graphql } from 'graphql'
import { expect, test } from 'vitest'
import {
	container,
	ctx,
	db,
	impactToken,
	publish,
	schema
} from '../../tests/resolver-context.ts'
import { DeletionKind } from '../gql/schema.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { NodeSettingsResolver } from '../resolvers/node-settings-resolver.ts'
import { ProjectResolver } from '../resolvers/project-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType, Role } from '../types.ts'
import { mediaIsRetained, requireRevision } from './content-revisions.ts'

const currentVersion = async () =>
	(
		await db
			.selectFrom('project')
			.select('version')
			.where('id', '=', 1)
			.executeTakeFirstOrThrow()
	).version
const save = (content: string, id?: number, expectedRevision = 0) =>
	container
		.get(ValueResolver)
		.upsertValue({ id, expectedRevision, node_id: 11, value: { content } }, ctx)

test('concurrent creates cannot produce duplicate scalar values and preserve the initial snapshot', async () => {
	const results = await Promise.allSettled([save('First'), save('Second')])
	expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(
		1
	)
	expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
	expect(
		await db
			.selectFrom('values')
			.selectAll()
			.where('project_id', '=', 1)
			.execute()
	).toHaveLength(1)
	const history = await container.get(ProjectResolver).getContentRevisions(ctx)
	expect(history).toHaveLength(2)
	const baseline = history.at(-1)
	expect(baseline).toBeDefined()
	if (!baseline) throw new Error('Missing baseline')
	expect(
		(await container.get(ProjectResolver).getContentRevision(baseline.id, ctx))
			.snapshot.values
	).toEqual([])
})

test('stale value saves reject without changing content, adding history or publishing an update', async () => {
	const original = await save('Original')
	const accepted = await save('Accepted', original.id, original.revision)
	const version = await currentVersion()
	publish.mockClear()
	await expect(
		save('Stale', original.id, original.revision)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	expect(
		await container.get(ValueResolver).value(original.id, 1)
	).toMatchObject(accepted)
	expect(await currentVersion()).toBe(version)
	expect(publish).not.toHaveBeenCalled()
})

test('field and settings changes require their own current versions', async () => {
	const nodes = container.get(NodeResolver)
	const field = await nodes.getNode(11, 1)
	await nodes.updateNode(
		{ id: 11, name: 'Title', expectedRevision: field.revision },
		ctx
	)
	await expect(
		nodes.updateNode(
			{ id: 11, name: 'Stale', expectedRevision: field.revision },
			ctx
		)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	const settings = container.get(NodeSettingsResolver)
	const { id } = await settings.upsertNodeSettings(
		{ node_id: 11, settings: {}, expectedRevision: 0 },
		ctx
	)
	await expect(
		settings.upsertNodeSettings(
			{ node_id: 11, settings: {}, expectedRevision: 0 },
			ctx
		)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	await settings.upsertNodeSettings(
		{ id, node_id: 11, settings: { required: true }, expectedRevision: 1 },
		ctx
	)
	await expect(
		settings.upsertNodeSettings(
			{ id, node_id: 11, settings: {}, expectedRevision: 1 },
			ctx
		)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
})

test('restore recovers deleted fields, nested list values and settings with fresh edit versions', async () => {
	const nodes = container.get(NodeResolver),
		values = container.get(ValueResolver),
		projects = container.get(ProjectResolver)
	const list = await nodes.insertNode(
		{ name: 'Entries', type: NodeType.list, order: 1, parent_id: 10 },
		{ scoped: true },
		ctx
	)
	const title = await nodes.insertNode(
		{ name: 'Title', type: NodeType.string, order: 0, parent_id: list.id },
		{ required: true },
		ctx
	)
	const item = await values.insertListItem(
		{ node_id: list.id, name: 'Entry' },
		ctx
	)
	const value = await values.upsertValue(
		{
			node_id: title.id,
			list_path: [item],
			expectedRevision: 0,
			value: { content: 'Keep me' }
		},
		ctx
	)
	const [revision] = await projects.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	await nodes.deleteNodeById(
		list.id,
		10,
		1,
		ctx,
		await impactToken(DeletionKind.Node, list.id)
	)
	const restoredVersion = await projects.restoreContentRevision(
		revision.id,
		await currentVersion(),
		ctx
	)
	expect(await nodes.getNode(title.id, 1)).toMatchObject({
		name: 'Title',
		parent_id: list.id,
		depth: 3
	})
	expect(await values.value(value.id, 1)).toMatchObject({
		value: { content: 'Keep me' },
		list_path: [item]
	})
	const restored = await values.value(value.id, 1)
	expect(restored?.revision).toBeGreaterThan(value.revision)
	await expect(
		values.upsertValue(
			{
				id: value.id,
				node_id: title.id,
				list_path: [item],
				expectedRevision: value.revision,
				value: { content: 'Stale' }
			},
			ctx
		)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	expect((await projects.getContentRevisions(ctx))[0]).toMatchObject({
		version: restoredVersion,
		summary: `Restored version ${revision.version}`,
		author_name: 'Test'
	})
	expect(
		await db
			.selectFrom('node_settings')
			.selectAll()
			.where('node_id', '=', title.id)
			.executeTakeFirst()
	).toMatchObject({ settings: expect.objectContaining({ required: true }) })
})

test('restore refuses a stale project version and preserves intervening work', async () => {
	await save('First')
	const projects = container.get(ProjectResolver),
		[revision] = await projects.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	const reviewedVersion = await currentVersion()
	const value = (
		await container.get(ValueResolver).getValues({ ids: [] }, ctx)
	)[0]
	if (!value) throw new Error('Missing content')
	await save('Later', value.id, value.revision)
	publish.mockClear()
	await expect(
		projects.restoreContentRevision(revision.id, reviewedVersion, ctx)
	).rejects.toMatchObject({ extensions: { code: 'CONFLICT' } })
	expect(
		(await container.get(ValueResolver).value(value.id, 1))?.value
	).toEqual({ content: 'Later' })
	expect(publish).not.toHaveBeenCalled()
})

test('history and restore remain scoped to the current project and checked by role', async () => {
	await save('Own content')
	const projects = container.get(ProjectResolver),
		[revision] = await projects.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	const foreign = { ...ctx, project_id: 2 }
	await expect(
		projects.getContentRevision(revision.id, foreign)
	).rejects.toThrow('Revision not found')
	await expect(
		projects.restoreContentRevision(revision.id, 0, foreign)
	).rejects.toThrow('Not authorized')
	await db
		.updateTable('project_user')
		.set({ roles: [Role.Viewer], owner: false })
		.where('project_id', '=', 1)
		.execute()
	const reader = await graphql({
		schema,
		contextValue: ctx,
		source: '{ getContentRevisions { id } }'
	})
	expect(reader.errors).toBeUndefined()
	const denied = await graphql({
		schema,
		contextValue: ctx,
		source:
			'mutation($id: Int!, $version: Int!) { restoreContentRevision(id: $id, expectedVersion: $version) }',
		variableValues: { id: revision.id, version: await currentVersion() }
	})
	expect(denied.errors?.[0].extensions.code).toBe('FORBIDDEN')
})

test('history pagination bounds requests and returns older revisions without repeats', async () => {
	const first = await save('A')
	const second = await save('B', first.id, first.revision)
	await save('C', second.id, second.revision)
	const projects = container.get(ProjectResolver),
		[latest] = await projects.getContentRevisions(ctx, undefined, 1)
	if (!latest) throw new Error('Missing revision')
	const older = await projects.getContentRevisions(ctx, latest.version, 100)
	expect(older).toHaveLength(3)
	expect(older.every(revision => revision.version < latest.version)).toBe(true)
	for (const limit of [0, 101, -1])
		await expect(
			projects.getContentRevisions(ctx, undefined, limit)
		).rejects.toThrow('page size')
	await expect(projects.getContentRevisions(ctx, -1)).rejects.toThrow(
		'page size'
	)
})

test('revision details and save acknowledgements are available through GraphQL', async () => {
	const result = await graphql({
		schema,
		contextValue: ctx,
		source:
			'mutation { upsertValue(data: { node_id: 11, expectedRevision: 0, value: { content: "Saved" } }) { id revision value } }'
	})
	expect(result.errors).toBeUndefined()
	expect(result.data?.upsertValue).toMatchObject({
		revision: 1,
		value: { content: 'Saved' }
	})
	const [revision] = await container
		.get(ProjectResolver)
		.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	const detail = await graphql({
		schema,
		contextValue: ctx,
		source:
			'query($id: Int!) { getContentRevision(id: $id) { revision { id author_name } snapshot } }',
		variableValues: { id: revision.id }
	})
	expect(detail.errors).toBeUndefined()
	const snapshot = contentSnapshotSchema.parse(
		detail.data?.getContentRevision &&
			typeof detail.data.getContentRevision === 'object' &&
			'snapshot' in detail.data.getContentRevision
			? detail.data.getContentRevision.snapshot
			: null
	)
	expect(snapshot.values[0]?.value).toEqual({ content: 'Saved' })
})

test('invalid archived content is rejected atomically during restore', async () => {
	const value = await save('Keep me')
	const projects = container.get(ProjectResolver),
		[revision] = await projects.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	const detail = await projects.getContentRevision(revision.id, ctx)
	await db
		.updateTable('content_revision')
		.set({
			snapshot: {
				...detail.snapshot,
				nodes: detail.snapshot.nodes.map(node => ({
					...node,
					name: '__invalid'
				}))
			}
		})
		.where('id', '=', revision.id)
		.execute()
	const version = await currentVersion()
	publish.mockClear()
	await expect(
		projects.restoreContentRevision(revision.id, version, ctx)
	).rejects.toThrow('Invalid API field')
	expect(
		(await container.get(ValueResolver).value(value.id, 1))?.value
	).toEqual({ content: 'Keep me' })
	expect(await currentVersion()).toBe(version)
	expect(publish).not.toHaveBeenCalled()
})

test('historical media survives replacement and deletion', async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.media })
		.where('id', '=', 11)
		.execute()
	const file = 'project_1/00000000-0000-0000-0000-000000000001'
	const values = container.get(ValueResolver)
	const first = await values.upsertValue(
		{
			node_id: 11,
			expectedRevision: 0,
			value: { file, name: 'photo', contentType: 'image/png', size: 10 }
		},
		ctx
	)
	await values.deleteValue(
		first.id,
		ctx,
		await impactToken(DeletionKind.Value, first.id)
	)
	expect(await mediaIsRetained(db, 1, file)).toBe(true)
	expect(await mediaIsRetained(db, 2, file)).toBe(false)
	expect(await mediaIsRetained(db, 1, file.replace(/1$/, '2'))).toBe(false)
})

test('malformed edit versions and revision project identities cannot pass restore checks', async () => {
	expect(() => requireRevision(-1, 1, 'Value')).toThrow('Invalid edit version')
	await save('Keep me')
	const projects = container.get(ProjectResolver),
		[revision] = await projects.getContentRevisions(ctx)
	if (!revision) throw new Error('Missing revision')
	const detail = await projects.getContentRevision(revision.id, ctx)
	await db
		.updateTable('content_revision')
		.set({
			snapshot: {
				...detail.snapshot,
				project: { ...detail.snapshot.project, id: 2 }
			}
		})
		.where('id', '=', revision.id)
		.execute()
	await expect(
		projects.restoreContentRevision(revision.id, await currentVersion(), ctx)
	).rejects.toThrow('Invalid revision project')
})
