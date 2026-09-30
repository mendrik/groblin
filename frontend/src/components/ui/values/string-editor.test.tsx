import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { StringEditor } from './string-editor'

const node: TreeNode = {
	id: 1,
	name: 'Title',
	type: NodeType.String,
	parent_id: 0,
	order: 0,
	depth: 2,
	revision: 1,
	nodes: []
}
test('staging a previously empty field preserves the input and blur save acknowledgement', async () => {
	const save = vi.fn().mockResolvedValue(1)
	const stage = vi.fn()
	const view = render(<StringEditor node={node} save={save} stage={stage} />)
	const input = screen.getByRole('textbox', { name: 'Title' })
	input.focus()
	fireEvent.change(input, { target: { value: 'Draft' } })
	view.rerender(
		<StringEditor
			node={node}
			save={save}
			stage={stage}
			value={{
				id: 0,
				node_id: 1,
				order: 0,
				list_path: [],
				revision: 0,
				updated_at: '',
				value: { content: 'Draft' }
			}}
		/>
	)
	expect(screen.getByRole('textbox', { name: 'Title' })).toBe(input)
	expect(document.activeElement).toBe(input)
	fireEvent.blur(input)
	await waitFor(() => expect(save).toHaveBeenCalledWith({ content: 'Draft' }))
})

test('a remote timestamp update preserves focus while the local edit keeps its base revision', () => {
	const save = vi.fn().mockResolvedValue(1)
	const value = {
		id: 7,
		node_id: 1,
		order: 0,
		list_path: [],
		revision: 4,
		updated_at: '2026-09-30T10:00:00Z',
		value: { content: 'Local draft' }
	}
	const view = render(<StringEditor node={node} value={value} save={save} />)
	const input = screen.getByRole('textbox', { name: 'Title' })
	input.focus()
	view.rerender(
		<StringEditor
			node={node}
			value={{ ...value, updated_at: '2026-09-30T10:01:00Z' }}
			save={save}
		/>
	)
	expect(screen.getByRole('textbox', { name: 'Title' })).toBe(input)
	expect(document.activeElement).toBe(input)
})
