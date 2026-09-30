import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { $currentRole } from '@/state/access'
import { deferred } from '../../../tests/deferred'
import { $historyOpen, ContentHistory } from './content-history'

const state = vi.hoisted(() => ({
	Api: {
		GetContentRevisions: vi.fn(),
		GetContentRevision: vi.fn(),
		GetProject: vi.fn(),
		RestoreContentRevision: vi.fn()
	},
	loadProject: vi.fn(),
	focused: { value: 11 as number | undefined },
	active: { value: {} },
	pending: { value: false, peek: () => false }
}))
vi.mock('@/gql-client', () => ({ Api: state.Api }))
vi.mock('@/state/project', () => ({ loadProject: state.loadProject }))
vi.mock('@/state/tree', () => ({ $focusedNode: state.focused }))
vi.mock('@/state/value', () => ({ $activeListItems: state.active }))
vi.mock('@/state/save-status', () => ({ hasPendingEdits: state.pending }))
const revision = {
	id: 5,
	version: 8,
	summary: 'Changed Title',
	author_name: 'Editor',
	created_at: '2026-09-30T10:00:00Z'
}
const snapshot = {
	formatVersion: 1,
	project: { id: 1, name: 'Project', version: 8 },
	nodes: [
		{
			id: 10,
			project_id: 1,
			name: 'Root',
			type: 'Root',
			revision: 1,
			parent_id: null,
			order: 0,
			depth: 1
		}
	],
	values: [],
	settings: []
}
beforeEach(() => {
	$currentRole.value = Role.Owner
	vi.resetAllMocks()
	$historyOpen.value = false
	state.pending.value = false
	state.Api.GetContentRevisions.mockResolvedValue([revision])
	state.Api.GetContentRevision.mockResolvedValue({ revision, snapshot })
	state.Api.GetProject.mockResolvedValue({
		project: { id: 1, name: 'Project', version: 9 }
	})
	state.loadProject.mockResolvedValue(undefined)
})
afterEach(() => {
	$historyOpen.value = false
})
const review = async () => {
	render(<ContentHistory />)
	act(() => {
		$historyOpen.value = true
	})
	fireEvent.click(
		await screen.findByRole('button', { name: /Version 8 · Changed Title/ })
	)
	await screen.findByRole('button', { name: 'Restore this version' })
}

test('history preview requires explicit confirmation and awaits the restore', async () => {
	const response = deferred<number>()
	state.Api.RestoreContentRevision.mockReturnValue(response.promise)
	await review()
	expect(
		screen.getByText('1 fields · 0 values · 0 field settings')
	).toBeDefined()
	fireEvent.click(screen.getByRole('button', { name: 'Restore this version' }))
	expect(state.Api.RestoreContentRevision).not.toHaveBeenCalled()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }))
	expect(state.Api.RestoreContentRevision).toHaveBeenCalledExactlyOnceWith({
		id: 5,
		expectedVersion: 9
	})
	expect(
		screen
			.getByRole('button', { name: 'Confirm restore' })
			.hasAttribute('disabled')
	).toBe(true)
	expect($historyOpen.value).toBe(true)
	await act(async () => response.resolve(10))
	await waitFor(() => expect($historyOpen.value).toBe(false))
	expect(state.loadProject).toHaveBeenCalledOnce()
	expect(state.focused.value).toBeUndefined()
})

test('a stale restore stays open and requires a refreshed review before confirmation', async () => {
	state.Api.RestoreContentRevision.mockRejectedValue(
		new Error('Project changed since you opened it.')
	)
	await review()
	fireEvent.click(screen.getByRole('button', { name: 'Restore this version' }))
	fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }))
	await screen.findByRole('alert')
	expect($historyOpen.value).toBe(true)
	expect(state.loadProject).not.toHaveBeenCalled()
	state.Api.GetProject.mockResolvedValue({ project: { version: 12 } })
	fireEvent.click(screen.getByRole('button', { name: 'Refresh review' }))
	await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
	await waitFor(() =>
		expect(
			screen
				.getByRole('button', { name: 'Restore this version' })
				.hasAttribute('disabled')
		).toBe(false)
	)
	state.Api.RestoreContentRevision.mockResolvedValue(13)
	fireEvent.click(screen.getByRole('button', { name: 'Restore this version' }))
	fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }))
	await waitFor(() =>
		expect(state.Api.RestoreContentRevision).toHaveBeenLastCalledWith({
			id: 5,
			expectedVersion: 12
		})
	)
})

test('pending edits prevent restoration', async () => {
	await review()
	state.pending.value = true
	act(() => {
		$historyOpen.value = false
		$historyOpen.value = true
	})
	await screen.findByText(
		'Save or discard pending edits before restoring a revision.'
	)
	expect(state.Api.RestoreContentRevision).not.toHaveBeenCalled()
})
