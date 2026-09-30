import { expect, test } from 'vitest'
import {
	container,
	ctx,
	db,
	publish,
	rowRevision
} from '../../tests/resolver-context.ts'
import { NodeSettingsResolver } from '../resolvers/node-settings-resolver.ts'
import { ValueResolver } from '../resolvers/value-resolver.ts'
import { NodeType } from '../types.ts'

async function seedChoices() {
	await db
		.updateTable('node')
		.set({ type: NodeType.choice })
		.where('id', '=', 11)
		.execute()
	const settings = container.get(NodeSettingsResolver)
	const { id } = await settings.upsertNodeSettings(
		{
			expectedRevision: 0,
			node_id: 11,
			settings: { choices: ['red', 'blue'] }
		},
		ctx
	)
	await container
		.get(ValueResolver)
		.upsertValue(
			{ expectedRevision: 0, node_id: 11, value: { selected: 'blue' } },
			ctx
		)
	publish.mockClear()
	return { settings, id }
}

test.each([['red'], []])(
	'choice edits preserve existing content when removing a used option (%j)',
	async (...choices) => {
		const { settings, id } = await seedChoices()
		await expect(
			settings.upsertNodeSettings(
				{
					expectedRevision: await rowRevision('node_settings', id),
					id,
					node_id: 11,
					settings: { choices }
				},
				ctx
			)
		).rejects.toThrow('would invalidate')
		expect(
			await container.get(ValueResolver).getValues({ ids: [] }, ctx)
		).toEqual([expect.objectContaining({ value: { selected: 'blue' } })])
		expect(await settings.getNodeSettings(ctx)).toEqual([
			expect.objectContaining({
				settings: expect.objectContaining({ choices: ['red', 'blue'] })
			})
		])
		expect(publish).not.toHaveBeenCalled()
	}
)

test('adding a choice preserves current selections and saves valid settings', async () => {
	const { settings, id } = await seedChoices()
	expect(
		await settings.upsertNodeSettings(
			{
				expectedRevision: await rowRevision('node_settings', id),
				id,
				node_id: 11,
				settings: { choices: ['red', 'blue', 'green'] }
			},
			ctx
		)
	).toMatchObject({ id })
	expect(
		await container.get(ValueResolver).getValues({ ids: [] }, ctx)
	).toHaveLength(1)
	expect(await container.get(ValueResolver).value(200, 2)).toMatchObject({
		value: { text: 'private' }
	})
})
