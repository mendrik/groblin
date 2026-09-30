import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ImportKind, NodeType } from '@/gql/graphql'
import { $currentRole, $projectChanging } from '@/state/access'
import type { TreeNode } from '@/state/tree'
import { deferred } from '../../../../tests/deferred'
import { ContentImportDialog, openContentImport } from './content-import-dialog'

const mocks = vi.hoisted(() => ({
	Api: { PreviewImport: vi.fn(), ImportArray: vi.fn(), ImportObject: vi.fn() },
	loadProject: vi.fn(),
	requireSettledEdits: vi.fn(),
	uploadToS3: vi.fn()
}))
vi.mock('@/gql-client', () => ({ Api: mocks.Api }))
vi.mock('@/state/project', () => ({
	loadProject: mocks.loadProject,
	requireSettledEdits: mocks.requireSettledEdits
}))
vi.mock('@/state/value', () => ({ activePath: () => [] }))
vi.mock('../zod-form/utils', () => ({ uploadToS3: mocks.uploadToS3 }))
const node: TreeNode = {
	id: 11,
	name: 'Entries',
	type: NodeType.List,
	revision: 1,
	order: 0,
	depth: 2,
	parent_id: 10,
	nodes: []
}
const preview = {
	version: 4,
	source: 'file-hash',
	name: 'Entries',
	fieldsAdded: 1,
	valuesAdded: 3,
	valuesChanged: 1,
	valuesRemoved: 2
}
beforeEach(() => {
	vi.resetAllMocks()
	$currentRole.value = Role.Owner
	$projectChanging.value = false
	mocks.Api.PreviewImport.mockResolvedValue(preview)
	mocks.uploadToS3.mockResolvedValue(
		'project_1/00000000-0000-0000-0000-000000000001'
	)
	mocks.loadProject.mockResolvedValue(undefined)
})
afterEach(() => {
	$projectChanging.value = false
	fireEvent.click(
		screen.queryByRole('button', { name: 'Cancel' }) ?? document.body
	)
})
const review = async (kind = ImportKind.Array) => {
	render(<ContentImportDialog />)
	act(() => openContentImport(node, kind))
	fireEvent.change(screen.getByLabelText('JSON file'), {
		target: {
			files: [new File(['[]'], 'data.json', { type: 'application/json' })]
		}
	})
	const form = screen.getByLabelText('JSON file').closest('form')
	if (!form) throw new Error('Missing import form')
	fireEvent.submit(form)
	await screen.findByRole('button', { name: 'Confirm import' })
}

test('imports only after a review, freezes editing, and closes after acknowledgement and reload', async () => {
	const pending = deferred<boolean>()
	mocks.Api.ImportArray.mockReturnValue(pending.promise)
	await review()
	expect(mocks.Api.ImportArray).not.toHaveBeenCalled()
	expect(screen.getByText(/1 fields added · 3 values added/)).toBeDefined()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }))
	expect($projectChanging.peek()).toBe(true)
	expect(mocks.Api.ImportArray).toHaveBeenCalledExactlyOnceWith({
		data: expect.objectContaining({ node_id: 11, structure: true }),
		expectedVersion: 4,
		expectedSource: 'file-hash'
	})
	expect(mocks.loadProject).not.toHaveBeenCalled()
	expect(
		screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')
	).toBe(true)
	await act(async () => pending.resolve(true))
	await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	expect(mocks.loadProject).toHaveBeenCalledOnce()
	expect($projectChanging.peek()).toBe(false)
})

test('failed confirmation retains the review and requires a fresh review before retrying', async () => {
	mocks.Api.ImportArray.mockRejectedValueOnce(
		new Error('Content changed. Review again.')
	)
	await review()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Content changed'
	)
	expect(
		screen
			.getByRole('button', { name: 'Confirm import' })
			.hasAttribute('disabled')
	).toBe(true)
	fireEvent.click(screen.getByRole('button', { name: 'Refresh review' }))
	await waitFor(() =>
		expect(
			screen
				.getByRole('button', { name: 'Confirm import' })
				.hasAttribute('disabled')
		).toBe(false)
	)
	expect(mocks.uploadToS3).toHaveBeenCalledOnce()
	expect(mocks.Api.ImportArray).toHaveBeenCalledOnce()
})

test('an Editor imports objects with the existing model and pending edits block opening', async () => {
	$currentRole.value = Role.Editor
	await review(ImportKind.Object)
	expect(mocks.Api.PreviewImport).toHaveBeenCalledWith({
		data: expect.objectContaining({ structure: false }),
		kind: ImportKind.Object
	})
	fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }))
	await waitFor(() => expect(mocks.Api.ImportObject).toHaveBeenCalledOnce())
	await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	mocks.requireSettledEdits.mockImplementation(() => {
		throw new Error('Pending edits')
	})
	expect(() => openContentImport(node, ImportKind.Array)).toThrow(
		'Pending edits'
	)
})
