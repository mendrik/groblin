import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { $currentRole } from '@/state/access'
import { deferred } from '../../../../tests/deferred'

const state = vi.hoisted(() => ({
	Api: {
		GetPublication: vi.fn(),
		GetContentRevisions: vi.fn(),
		GetContentRevision: vi.fn(),
		PublishContent: vi.fn()
	},
	pending: false
}))
vi.mock('@/gql-client', () => ({ Api: state.Api }))
vi.mock('@/state/project', async () => ({
	$project: (await import('@preact/signals-react')).signal({ id: 1 })
}))
vi.mock('@/state/save-status', () => ({
	hasPendingEdits: {
		get value() {
			return state.pending
		},
		peek: () => state.pending
	}
}))
vi.mock('../page', () => ({
	Page: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}))

import { Publication } from './publication'

const initial = {
	draftVersion: 8,
	current: {
		id: 5,
		revision_id: 15,
		version: 7,
		author_name: 'Owner',
		summary: 'Saved',
		created_at: '2026-09-30T10:00:00Z'
	},
	history: [
		{
			id: 5,
			revision_id: 15,
			version: 7,
			author_name: 'Owner',
			summary: 'Saved',
			created_at: '2026-09-30T10:00:00Z'
		}
	]
}
const snapshot = {
	formatVersion: 1,
	project: { id: 1, name: 'Project', version: 8 },
	nodes: [
		{
			id: 10,
			name: 'Root',
			project_id: 1,
			type: 'Root',
			revision: 1,
			order: 0,
			depth: 1,
			parent_id: null
		}
	],
	values: [],
	settings: []
}

beforeEach(() => {
	vi.resetAllMocks()
	state.pending = false
	$currentRole.value = Role.Owner
	state.Api.GetPublication.mockResolvedValue(initial)
	state.Api.GetContentRevisions.mockResolvedValue([{ id: 16, version: 8 }])
	state.Api.GetContentRevision.mockResolvedValue({
		revision: { id: 16, version: 8 },
		snapshot
	})
})
const review = async () => {
	render(<Publication />)
	fireEvent.click(
		await screen.findByRole('button', { name: 'Review draft for publication' })
	)
	fireEvent.click(await screen.findByRole('button', { name: 'Continue' }))
}

test('publishing requires a reviewed revision and confirmation and waits for acknowledgement', async () => {
	const response = deferred<unknown>()
	state.Api.PublishContent.mockReturnValue(response.promise)
	await review()
	expect(state.Api.PublishContent).not.toHaveBeenCalled()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm publication' }))
	expect(state.Api.PublishContent).toHaveBeenCalledWith({
		expectedVersion: 8,
		expectedPublication: 5,
		revisionId: 16
	})
	expect(
		screen.getByRole('button', { name: 'Publishing…' }).hasAttribute('disabled')
	).toBe(true)
	await act(async () => response.resolve({ id: 6 }))
	await waitFor(() =>
		expect(
			screen.queryByRole('button', { name: 'Confirm publication' })
		).toBeNull()
	)
})

test('stale publication leaves review available and requires confirmation again', async () => {
	state.Api.PublishContent.mockRejectedValue(
		new Error('Publication changed since review.')
	)
	await review()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm publication' }))
	await screen.findByRole('alert')
	expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined()
	expect(screen.getByRole('button', { name: 'Refresh review' })).toBeDefined()
})

test('viewer has no publication action and pending edits prevent publication review', async () => {
	$currentRole.value = Role.Viewer
	const view = render(<Publication />)
	await screen.findByText('Draft version 8 · Published version 7')
	expect(
		screen.queryByRole('button', { name: 'Review draft for publication' })
	).toBeNull()
	$currentRole.value = Role.Owner
	state.pending = true
	view.rerender(<Publication />)
	expect(
		screen
			.getByRole('button', { name: 'Review draft for publication' })
			.hasAttribute('disabled')
	).toBe(true)
})
