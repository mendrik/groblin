import { expect, test } from 'vitest'
import {
	confirmedImport,
	container,
	ctx,
	db,
	deleteFile,
	getContent,
	publish
} from '../../tests/resolver-context.ts'
import { ImportKind } from '../gql/schema.ts'
import { IoResolver } from '../resolvers/io-resolver.ts'
import { NodeResolver } from '../resolvers/node-resolver.ts'
import { NodeType, Role } from '../types.ts'
import { readContentSnapshot } from './content-revisions.ts'

const file = 'project_1/00000000-0000-0000-0000-000000000001'
const prepare = async () => {
	await db
		.updateTable('node')
		.set({ type: NodeType.list })
		.where('id', '=', 11)
		.execute()
	return { node_id: 11, data: file, structure: true, external_id: 'id' }
}
const ownValues = () =>
	db
		.selectFrom('values')
		.selectAll()
		.where('project_id', '=', 1)
		.orderBy('id')
		.execute()

test('preview rolls back all content and history, then confirmation records one accepted import', async () => {
	const data = await prepare()
	getContent.mockResolvedValue(
		'[{"id":"a","title":"One","parts":[{"id":"p","label":"First"}]}]'
	)
	const before = await readContentSnapshot(db, 1)
	const io = container.get(IoResolver)
	const preview = await io.previewImport(data, ImportKind.Array, ctx)
	expect(preview).toMatchObject({
		fieldsAdded: 3,
		valuesAdded: 4,
		valuesChanged: 0,
		valuesRemoved: 0
	})
	expect(await readContentSnapshot(db, 1)).toEqual(before)
	expect(
		await db.selectFrom('content_revision').select('id').execute()
	).toEqual([])
	expect(publish).not.toHaveBeenCalled()
	expect(deleteFile).not.toHaveBeenCalled()
	await io.importArray(data, ctx, preview.version, preview.source)
	expect(await ownValues()).toHaveLength(4)
	expect(
		await db.selectFrom('content_revision').select('id').execute()
	).toHaveLength(2)
	expect(deleteFile).toHaveBeenCalledExactlyOnceWith(file)
})

test('repeated identities preserve parent and scalar IDs and replace nested rows in valid paths', async () => {
	const data = await prepare()
	getContent.mockResolvedValue(
		'[{"id":"a","title":"One","parts":[{"id":"same","label":"Old"}]},{"id":"b","title":"Two","parts":[{"id":"same","label":"Other"}]}]'
	)
	await confirmedImport(data)
	const before = await ownValues()
	const parent = before.find(
		value => value.node_id === 11 && value.external_id === 'a'
	)
	const other = before.find(
		value => value.node_id === 11 && value.external_id === 'b'
	)
	expect(parent).toBeDefined()
	expect(other).toBeDefined()
	if (!parent || !other) throw new Error('Missing imported parents')
	const title = before.find(
		value => JSON.stringify(value.value) === '{"content":"One"}'
	)
	const oldPart = before.find(
		value => value.external_id === 'same' && value.list_path?.[0] === parent.id
	)
	getContent.mockResolvedValue(
		'[{"id":"a","title":"Changed","parts":[{"id":"same","label":"New"}]}]'
	)
	const io = container.get(IoResolver)
	const preview = await io.previewImport(data, ImportKind.Array, ctx)
	expect(preview).toMatchObject({
		valuesChanged: 1,
		valuesAdded: 2,
		valuesRemoved: 2
	})
	await io.importArray(data, ctx, preview.version, preview.source)
	const after = await ownValues()
	expect(after.find(value => value.id === parent.id)).toEqual(parent)
	expect(after.find(value => value.id === title?.id)).toMatchObject({
		value: { content: 'Changed' },
		list_path: [parent.id],
		revision: (title?.revision ?? 0) + 1
	})
	expect(after.find(value => value.id === oldPart?.id)).toBeUndefined()
	const part = after.find(
		value => value.external_id === 'same' && value.list_path?.[0] === parent.id
	)
	expect(after).toContainEqual(
		expect.objectContaining({
			value: { content: 'New' },
			list_path: [parent.id, part?.id]
		})
	)
	expect(
		after.filter(
			value => value.id === other.id || value.list_path?.includes(other.id)
		)
	).toEqual(
		before.filter(
			value => value.id === other.id || value.list_path?.includes(other.id)
		)
	)
})

test('an updated model or changed source requires a new review and leaves the upload intact', async () => {
	const data = await prepare()
	getContent.mockResolvedValue('[{"id":"a","title":"One"}]')
	const io = container.get(IoResolver)
	const preview = await io.previewImport(data, ImportKind.Array, ctx)
	getContent.mockResolvedValue('[{"id":"a","title":"Another"}]')
	await expect(
		io.importArray(data, ctx, preview.version, preview.source)
	).rejects.toThrow('uploaded file changed')
	const updated = await io.previewImport(data, ImportKind.Array, ctx)
	await container
		.get(NodeResolver)
		.insertNode(
			{ parent_id: 10, name: 'ChangedModel', type: NodeType.string, order: 1 },
			undefined,
			ctx
		)
	await expect(
		io.importArray(data, ctx, updated.version, updated.source)
	).rejects.toThrow('changed')
	expect(await ownValues()).toEqual([])
	expect(deleteFile).not.toHaveBeenCalled()
})

test('Editors import existing fields without changing the model or list settings', async () => {
	const data = await prepare()
	getContent.mockResolvedValue('[{"id":"a","title":"One"}]')
	await confirmedImport(data)
	await db
		.insertInto('node_settings')
		.values({ node_id: 11, project_id: 1, settings: { scoped: false } })
		.execute()
	await db
		.updateTable('project_user')
		.set({ owner: false, roles: [Role.Editor] })
		.where('project_id', '=', 1)
		.execute()
	const before = await readContentSnapshot(db, 1)
	getContent.mockResolvedValue('[{"id":"b","title":"Editor"}]')
	await expect(confirmedImport(data)).rejects.toThrow('Not authorized')
	await confirmedImport({ ...data, structure: false })
	const after = await readContentSnapshot(db, 1)
	expect(after.nodes).toEqual(before.nodes)
	expect(after.settings).toEqual(before.settings)
	getContent.mockResolvedValue('[{"id":"c","unmodeled":"Reject"}]')
	await expect(confirmedImport({ ...data, structure: false })).rejects.toThrow(
		'Unknown field'
	)
})

test('object import updates root fields, retains scalar identity, and validates JSON shapes', async () => {
	const data = { node_id: 10, data: file, structure: false }
	const io = container.get(IoResolver)
	getContent.mockResolvedValue('{"own":"Hello"}')
	const preview = await io.previewImport(data, ImportKind.Object, ctx)
	expect(preview).toMatchObject({ fieldsAdded: 0, valuesAdded: 1 })
	await io.importObject(data, ctx, preview.version, preview.source)
	const original = (await ownValues())[0]
	getContent.mockResolvedValue('{"own":"Updated"}')
	const second = await io.previewImport(data, ImportKind.Object, ctx)
	await io.importObject(data, ctx, second.version, second.source)
	expect((await ownValues())[0]).toMatchObject({
		id: original?.id,
		value: { content: 'Updated' }
	})
	getContent.mockResolvedValue('[]')
	await expect(io.previewImport(data, ImportKind.Object, ctx)).rejects.toThrow(
		'JSON array'
	)
	getContent.mockResolvedValue('{"own":false}')
	await expect(io.previewImport(data, ImportKind.Object, ctx)).rejects.toThrow(
		'field type'
	)
	getContent.mockResolvedValue('{"own":null}')
	await expect(
		io.previewImport({ ...data, structure: true }, ImportKind.Object, ctx)
	).rejects.toThrow('field type')
})

test('distinct list fields can use the same external ID in the same parent scope', async () => {
	const data = await prepare()
	getContent.mockResolvedValue(
		'[{"id":"a","left":[{"id":"one","leftLabel":"Left"}],"right":[{"id":"one","rightLabel":"Right"}]}]'
	)
	await confirmedImport(data)
	expect(
		(await ownValues()).filter(value => value.external_id === 'one')
	).toHaveLength(2)
})
