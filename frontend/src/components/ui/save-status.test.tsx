import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NodeType, type Value } from '@/gql/graphql'
import { contentSaveQueues } from '@/state/save-status'
import { $nodes } from '@/state/tree'
import { valueSaves } from '@/state/value'
import { deferred } from '../../../tests/deferred'
import { $saveStatusOpen, SaveStatus } from './save-status'

const api = vi.hoisted(() => ({ UpsertValue: vi.fn(), GetValues: vi.fn() }))
vi.mock('@/gql-client', () => ({ Api: api, Subscribe: {} }))
const input = {
	id: 12,
	node_id: 11,
	list_path: [],
	expectedRevision: 1,
	value: { content: 'Mine' }
}
const latest: Value = {
	id: 12,
	node_id: 11,
	list_path: [],
	order: 0,
	revision: 4,
	value: { content: 'Theirs' },
	updated_at: '2026-09-30T10:00:00Z'
}
beforeEach(() => {
	vi.clearAllMocks()
	$saveStatusOpen.value = false
	for (const queue of contentSaveQueues)
		for (const edit of queue.edits.peek()) queue.discard(edit.key)
	localStorage.clear()
	valueSaves.configure(1, 'ui-test')
	$nodes.value = [
		{
			id: 10,
			name: 'Root',
			type: NodeType.Root,
			revision: 1,
			parent_id: null,
			order: 0,
			depth: 1
		},
		{
			id: 11,
			name: 'Title',
			type: NodeType.String,
			revision: 1,
			parent_id: 10,
			order: 0,
			depth: 2
		}
	]
})
afterEach(() => {
	for (const queue of contentSaveQueues)
		for (const edit of queue.edits.peek()) queue.discard(edit.key)
})

test('save status stays pending until acknowledgement and protects an unfinished edit on unload', async () => {
	const response = deferred<Value>()
	api.UpsertValue.mockReturnValue(response.promise)
	render(<SaveStatus />)
	expect(screen.getByRole('status').textContent).toBe('All changes saved')
	let saving: Promise<number>
	act(() => {
		saving = valueSaves.save(input, 'Title')
	})
	expect(screen.getByRole('status').textContent).toBe('Saving…')
	const leaving = new Event('beforeunload', { cancelable: true })
	window.dispatchEvent(leaving)
	expect(leaving.defaultPrevented).toBe(true)
	await act(async () => {
		response.resolve({ ...latest, value: input.value, revision: 2 })
		await saving
	})
	expect(screen.getByRole('status').textContent).toBe('All changes saved')
	const saved = new Event('beforeunload', { cancelable: true })
	window.dispatchEvent(saved)
	expect(saved.defaultPrevented).toBe(false)
})

test('conflict review shows both edits and requires an explicit save choice', async () => {
	api.UpsertValue.mockRejectedValueOnce(
		Object.assign(new Error('Another editor changed this value.'), {
			code: 'CONFLICT'
		})
	)
	render(<SaveStatus />)
	await act(async () => {
		await expect(valueSaves.save(input, 'Title')).rejects.toThrow(
			'Another editor'
		)
	})
	fireEvent.click(screen.getByRole('button', { name: 'Conflict needs review' }))
	expect(screen.getByText('Mine', { exact: false })).toBeDefined()
	expect(screen.queryByRole('button', { name: 'Save my edit' })).toBeNull()
	api.GetValues.mockResolvedValue([latest])
	fireEvent.click(screen.getByRole('button', { name: 'Review latest' }))
	await screen.findByText('Theirs', { exact: false })
	expect(api.UpsertValue).toHaveBeenCalledOnce()
	api.UpsertValue.mockResolvedValue({
		...latest,
		revision: 5,
		value: input.value
	})
	fireEvent.click(screen.getByRole('button', { name: 'Save my edit' }))
	await waitFor(() => expect(valueSaves.hasPending.value).toBe(false))
	expect(api.UpsertValue).toHaveBeenLastCalledWith({
		data: { ...input, expectedRevision: 4 }
	})
})
