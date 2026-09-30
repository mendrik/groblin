import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { $currentRole } from '@/state/access'

const state = vi.hoisted(() => ({
	drafts: new Map<
		string,
		{
			id: number
			node_id: number
			list_path: number[]
			expectedRevision: number
			value: { content: string }
		}
	>(),
	focused: { value: 1 },
	path: [] as number[],
	nodes: {
		value: { 1: { id: 1, type: 'article' }, 2: { id: 2, type: 'article' } }
	},
	values: {
		value: {
			1: [{ id: 10, revision: 1, value: { content: 'First article' } }],
			2: [{ id: 20, revision: 1, value: { content: 'Second article' } }]
		}
	},
	save: vi.fn().mockResolvedValue(1)
}))
vi.mock('@/state/tree', () => ({
	$focusedNode: state.focused,
	$nodesMap: state.nodes,
	asNode: (id: 1 | 2) => state.nodes.value[id]
}))
vi.mock('@/state/value', () => ({
	$valueMap: state.values,
	activePath: () => state.path,
	saveValue: state.save,
	stageValue: (data: {
		id: number
		node_id: number
		list_path: number[]
		expectedRevision: number
		value: { content: string }
	}) => state.drafts.set(`${data.node_id}:${data.list_path.join(',')}`, data),
	valueDraft: (id: number, path: number[]) =>
		state.drafts.get(`${id}:${path.join(',')}`)
}))
vi.mock('@/components/editor/tiptap-editor', () => ({
	default: ({
		defaultValue,
		onChange
	}: {
		defaultValue: string
		onChange: (value: string) => void
	}) => (
		<textarea
			aria-label="Article"
			defaultValue={defaultValue}
			onChange={event => onChange(event.target.value)}
		/>
	)
}))

import { PreviewPanel } from './preview-panel'

beforeEach(() => {
	$currentRole.value = Role.Owner
	state.focused.value = 1
	state.path = []
	state.values.value[1] = [
		{ id: 10, revision: 1, value: { content: 'First article' } }
	]
	state.save.mockClear()
	state.drafts.clear()
})
afterEach(() => vi.useRealTimers())

const advanceAutosave = () =>
	act(async () => {
		await vi.advanceTimersByTimeAsync(500)
	})

test('switching nodes cancels the pending draft and saves subsequent edits to the new node', async () => {
	const view = render(<PreviewPanel width={500} />)
	const editor = await screen.findByRole('textbox', { name: 'Article' })
	vi.useFakeTimers()
	fireEvent.change(editor, { target: { value: 'Unsaved first article' } })
	state.focused.value = 2
	view.rerender(<PreviewPanel width={500} />)
	expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
		'Second article'
	)
	await advanceAutosave()
	expect(state.save).not.toHaveBeenCalled()
	fireEvent.change(screen.getByRole('textbox'), {
		target: { value: 'Edited second article' }
	})
	await advanceAutosave()
	expect(state.save).toHaveBeenCalledExactlyOnceWith({
		id: 20,
		expectedRevision: 1,
		node_id: 2,
		list_path: [],
		value: { content: 'Edited second article' }
	})
})

test('switching list items on the same article node cancels the old draft', async () => {
	state.path = [100]
	const view = render(<PreviewPanel width={500} />)
	const editor = await screen.findByRole('textbox', { name: 'Article' })
	vi.useFakeTimers()
	fireEvent.change(editor, { target: { value: 'Old list item draft' } })
	state.path = [200]
	state.values.value[1] = [
		{ id: 30, revision: 1, value: { content: 'New list item' } }
	]
	view.rerender(<PreviewPanel width={500} />)
	expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
		'New list item'
	)
	await advanceAutosave()
	expect(state.save).not.toHaveBeenCalled()
	fireEvent.change(screen.getByRole('textbox'), {
		target: { value: 'New item edited' }
	})
	await advanceAutosave()
	expect(state.save).toHaveBeenCalledExactlyOnceWith({
		id: 30,
		expectedRevision: 1,
		node_id: 1,
		list_path: [200],
		value: { content: 'New item edited' }
	})
})

test('unmounting the article cancels autosave', async () => {
	const view = render(<PreviewPanel width={500} />)
	const editor = await screen.findByRole('textbox', { name: 'Article' })
	vi.useFakeTimers()
	fireEvent.change(editor, { target: { value: 'Unsaved draft' } })
	view.unmount()
	await advanceAutosave()
	expect(state.save).not.toHaveBeenCalled()
})
