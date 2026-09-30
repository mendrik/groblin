import { parse, subscribe } from 'graphql'
import { expect, test, vi } from 'vitest'
import { ctx, db, pubSub, schema } from '../../tests/resolver-context.ts'
import { Role, Topic } from '../types.ts'

const value = (project_id: number, id: number) => ({
	project_id,
	id,
	node_id: 11,
	order: 0,
	list_path: null,
	value: { content: String(id) },
	updated_at: new Date()
})

test.each([
	['nodesUpdated', Topic.NodesUpdated, 2, 1, true],
	[
		'nodeSettingsUpdated',
		Topic.NodeSettingsUpdated,
		{ project_id: 2 },
		{ project_id: 1 },
		true
	],
	['apiKeysUpdated', Topic.ApiKeysUpdated, 2, 1, true],
	['usersUpdated', Topic.UsersUpdated, 2, 1, true],
	[
		'valuesUpdated { id value }',
		Topic.ValuesUpdated,
		value(2, 200),
		value(1, 100),
		{ id: 100, value: { content: '100' } }
	]
])(
	'subscription %s filters foreign events through the GraphQL schema',
	async (selection, topic, foreign, own, expected) => {
		const result = await subscribe({
			schema,
			document: parse(`subscription { ${selection} }`),
			contextValue: ctx
		})
		if (!('next' in result))
			throw new Error(`Subscription failed: ${JSON.stringify(result)}`)
		try {
			const next = result.next()
			pubSub.publish(topic, foreign)
			pubSub.publish(topic, own)
			expect(await next).toMatchObject({
				done: false,
				value: { data: { [selection.split(' ')[0]]: expected } }
			})
		} finally {
			await result.return?.()
		}
	}
)

test('list deletion notifications serialize as nullable refresh events', async () => {
	const result = await subscribe({
		schema,
		document: parse('subscription { valuesUpdated { id } }'),
		contextValue: ctx
	})
	if (!('next' in result)) throw new Error('Subscription failed')
	try {
		const next = result.next()
		pubSub.publish(Topic.ValuesUpdated, 1)
		expect(await next).toEqual({
			done: false,
			value: { data: { valuesUpdated: null } }
		})
	} finally {
		await result.return?.()
	}
})

test('an established subscription rechecks membership before delivering every event', async () => {
	const authorize = vi.fn(ctx.authorize)
	const result = await subscribe({
		schema,
		document: parse('subscription { valuesUpdated { id } }'),
		contextValue: { ...ctx, authorize }
	})
	if (!('next' in result)) throw new Error('Subscription failed')
	try {
		const first = result.next()
		pubSub.publish(Topic.ValuesUpdated, value(1, 100))
		expect(await first).toMatchObject({
			value: { data: { valuesUpdated: { id: 100 } } }
		})
		await db.deleteFrom('project_user').where('project_id', '=', 1).execute()
		authorize.mockClear()
		const next = result.next()
		pubSub.publish(Topic.ValuesUpdated, value(1, 101))
		await expect
			.poll(() => authorize.mock.settledResults)
			.toContainEqual({ type: 'fulfilled', value: false })
		await db
			.insertInto('project_user')
			.values({
				project_id: 1,
				user_id: ctx.user.id,
				roles: [Role.Admin],
				confirmed: true
			})
			.execute()
		pubSub.publish(Topic.ValuesUpdated, value(1, 102))
		expect(await next).toMatchObject({
			value: { data: { valuesUpdated: { id: 102 } } }
		})
	} finally {
		await result.return?.()
	}
})
