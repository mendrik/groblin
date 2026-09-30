import { Role } from '@shared/project-roles'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { NodeType, type Value } from '@/gql/graphql'
import { $currentRole } from '@/state/access'
import type { TreeNode } from '@/state/tree'

const save = vi.hoisted(() => vi.fn().mockResolvedValue(1))
vi.mock('@/state/tree', () => ({ pathTo: () => [] }))
vi.mock('@/state/value', () => ({
	$activeListItems: { value: {} },
	activePath: () => [],
	saveValue: save,
	stageValue: vi.fn(),
	valueDraft: () => undefined
}))
vi.mock('@/state/node-settings', () => ({ $nodeSettingsMap: { value: {} } }))
vi.mock('./boolean-editor', () => ({ BooleanEditor: () => null }))
vi.mock('./color-editor', () => ({ ColorEditor: () => null }))
vi.mock('./date-editor', () => ({ DateEditor: () => null }))
vi.mock('./list-editor', () => ({ ListEditor: () => null }))
vi.mock('./string-editor', () => ({ StringEditor: () => null }))
vi.mock('./article-editor', () => ({ ArticleEditor: () => null }))
vi.mock('./choice-editor', () => ({ ChoiceEditor: () => null }))
vi.mock('./media-editor', () => ({ MediaEditor: () => null }))
vi.mock('../random/masked-input', () => ({
	MaskedInput: ({
		defaultValue,
		onAccept,
		onBlur
	}: {
		defaultValue: number
		onAccept: (text: string, mask: { typedValue: string }) => void
		onBlur: () => void
	}) => (
		<input
			aria-label="Number"
			defaultValue={defaultValue}
			onChange={event =>
				onAccept(event.target.value, { typedValue: event.target.value })
			}
			onBlur={onBlur}
		/>
	)
}))

import { ValueEditor } from './value-editor'

test('switching list records clears the previous number draft', () => {
	const node: TreeNode = {
		id: 1,
		revision: 1,
		name: 'Count',
		type: NodeType.Number,
		order: 0,
		depth: 1,
		nodes: []
	}
	const value = (id: number, figure: number): Value => ({
		id,
		node_id: 1,
		revision: 1,
		order: 0,
		list_path: [id],
		value: { figure },
		updated_at: new Date().toISOString()
	})
	$currentRole.value = Role.Editor
	const view = render(
		<ValueEditor node={node} value={[value(10, 1)]} listPath={[10]} />
	)
	fireEvent.change(screen.getByRole('textbox'), { target: { value: '42' } })
	view.rerender(
		<ValueEditor node={node} value={[value(20, 2)]} listPath={[20]} />
	)
	fireEvent.blur(screen.getByRole('textbox'))
	expect(save).not.toHaveBeenCalledWith(
		expect.objectContaining({ id: 20, value: { figure: 42 } })
	)
	expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('2')
})
