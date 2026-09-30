import { graphql } from 'graphql'
import { afterEach, expect, test, vi } from 'vitest'
import { number, object, string } from 'zod'
import {
	ctx,
	db,
	getContent,
	impactToken,
	schema
} from '../../tests/resolver-context.ts'
import { DeletionKind } from '../gql/schema.ts'
import { UserResolver } from '../resolvers/user-resolver.ts'
import { hashApiKey } from '../security/api-key.ts'

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllEnvs()
})
const execute = (source: string, variableValues?: Record<string, unknown>) =>
	graphql({ schema, source, variableValues, contextValue: ctx })
const run = async (
	source: string,
	variableValues?: Record<string, unknown>
) => {
	const result = await execute(source, variableValues)
	expect(result.errors).toBeUndefined()
	return result.data
}

test('an administrator models, edits and deletes content through the generated API', async () => {
	const inserted = await run(
		'mutation { insertNode(data: { name: "Articles", type: list, parent_id: 10, order: 1 }) { id type } }'
	)
	const {
		insertNode: { id: nodeId }
	} = object({ insertNode: object({ id: number() }) }).parse(inserted)
	await run(
		'mutation($id: Int!) { updateNode(data: { expectedRevision: 1, id: $id, name: "Posts" }) { id revision name } }',
		{ id: nodeId }
	)
	const result = await run(
		'mutation($id: Int!) { insertListItem(listItem: { node_id: $id, name: "First" }) }',
		{ id: nodeId }
	)
	const { insertListItem: itemId } = object({ insertListItem: number() }).parse(
		result
	)
	await run(
		'query($id: Int!) { getListItems(request: { node_id: $id }) { id children { id } } getListColumns(node_id: $id) { id } }',
		{ id: nodeId }
	)
	const settings = await run(
		'mutation { upsertNodeSettings(data: { expectedRevision: 0, node_id: 11, settings: { required: true } }) { id revision } }'
	)
	expect(settings?.upsertNodeSettings).toMatchObject({
		id: expect.any(Number),
		revision: 1
	})
	const saved = await run(
		'mutation { upsertValue(data: { expectedRevision: 0, node_id: 11, value: { content: "Hello" } }) { id revision } }'
	)
	const {
		upsertValue: { id: valueId }
	} = object({ upsertValue: object({ id: number() }) }).parse(saved)
	const read = await run(
		'{ getNodes { id type } getValues(data: { ids: [] }) { id value updated_at } getNodeSettings { id settings } getProject { project { id } nodes { id } values { id } nodeSettings { id } } }'
	)
	expect(read?.getValues).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: valueId, value: { content: 'Hello' } })
		])
	)
	await run(
		'mutation($id: Int!, $expected: String!) { deleteValue(id: $id, expectedImpact: $expected) }',
		{ id: valueId, expected: await impactToken(DeletionKind.Value, valueId) }
	)
	await run(
		'mutation($expected: String!) { truncate(data: { node_id: 11, expectedImpact: $expected }) }',
		{ expected: await impactToken(DeletionKind.NodeValues, 11) }
	)
	await run(
		'mutation($id: Int!, $expected: String!) { deleteListItem(id: $id, expectedImpact: $expected) }',
		{ id: itemId, expected: await impactToken(DeletionKind.Value, itemId) }
	)
	await run(
		'mutation($id: Int!, $expected: String!) { deleteNodeById(id: $id, parent_id: 10, order: 1, expectedImpact: $expected) }',
		{ id: nodeId, expected: await impactToken(DeletionKind.Node, nodeId) }
	)
})

test('API key lifecycle and membership actions are reachable only with an authorized session', async () => {
	const result = await run(
		'mutation { createApiKey(data: { name: "Website" }) { key created_at expires_at is_active } }'
	)
	const {
		createApiKey: { key }
	} = object({ createApiKey: object({ key: string() }) }).parse(result)
	const fingerprint = hashApiKey(key)
	const listed = await run(
		'{ getApiKeys { key name is_active } getUsers { id roles owner confirmed } }'
	)
	expect(listed?.getApiKeys).toEqual([
		expect.objectContaining({
			key: fingerprint,
			name: 'Website',
			is_active: true
		})
	])
	await run('mutation($key: String!) { toggleApiKey(key: $key) }', {
		key: fingerprint
	})
	await run('mutation($key: String!) { deleteApiKey(key: $key) }', {
		key: fingerprint
	})
	await db
		.insertInto('user')
		.values({
			id: 'invited',
			email: 'invited@example.invalid',
			name: 'Invited',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		})
		.execute()
	await run(
		'mutation { inviteUser(data: { email: "invited@example.invalid" }) { invitation { id role } url emailSent } }'
	)
	expect((await run('{ getUsers { id } }'))?.getUsers).not.toContainEqual({
		id: 'invited'
	})
	await db
		.insertInto('project_user')
		.values({
			project_id: 1,
			user_id: 'invited',
			roles: ['Editor'],
			confirmed: true
		})
		.execute()
	await run('mutation { deleteUser(id: "invited") }')
	expect((await run('{ getUsers { id } }'))?.getUsers).not.toContainEqual({
		id: 'invited'
	})
})

test('uploads and imports work through the same project-authorized API boundary', async () => {
	vi.stubEnv('AWS_BUCKET', 'test-bucket')
	const upload = await run(
		'mutation { uploadUrl(data: { filename: "posts.json", contentType: "application/json", size: 10, purpose: "JSON_IMPORT" }) { signedUrl object } }'
	)
	expect(upload?.uploadUrl).toMatchObject({
		object: expect.stringMatching(/^project_1\//),
		signedUrl: expect.stringContaining('X-Amz-Signature=')
	})
	const inserted = await run(
		'mutation { insertNode(data: { name: "Entries", type: list, parent_id: 10, order: 1 }) { id } }'
	)
	const {
		insertNode: { id }
	} = object({ insertNode: object({ id: number() }) }).parse(inserted)
	getContent.mockResolvedValue('[{"title":"A post"}]')
	const review = await run(
		'query($id: Int!) { previewImport(data: { node_id: $id, structure: true, data: "project_1/00000000-0000-0000-0000-000000000001" }, kind: ARRAY) { version source } }',
		{ id }
	)
	const {
		previewImport: { version, source }
	} = object({
		previewImport: object({ version: number(), source: string() })
	}).parse(review)
	await run(
		'mutation($id: Int!, $version: Int!, $source: String!) { importArray(data: { node_id: $id, structure: true, data: "project_1/00000000-0000-0000-0000-000000000001" }, expectedVersion: $version, expectedSource: $source) }',
		{ id, version, source }
	)
	const result = await run(
		'query($id: Int!) { getListItems(request: { node_id: $id }) { children { value } } }',
		{ id }
	)
	expect(result?.getListItems).toEqual([
		{ children: [{ value: { content: 'A post' } }] }
	])
})

test('unexpected resolver failures are masked and logged with a request identifier', async () => {
	const log = vi.spyOn(console, 'error').mockImplementation(() => {})
	vi.spyOn(UserResolver.prototype, 'inviteUser').mockRejectedValueOnce(
		new Error('Private failure details')
	)
	const result = await execute(
		'mutation { inviteUser(data: { email: "missing@example.invalid" }) { url } }'
	)
	expect(result.errors?.[0]).toMatchObject({
		message: 'Request failed',
		extensions: { code: 'INTERNAL_SERVER_ERROR' }
	})
	expect(log).toHaveBeenCalledWith(
		'Operation failed',
		expect.objectContaining({
			requestId: 'test',
			operation: 'inviteUser',
			error: expect.any(Error)
		})
	)
})
