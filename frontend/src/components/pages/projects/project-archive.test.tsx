import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { $currentRole, $projectChanging } from '@/state/access'
import { deferred } from '../../../../tests/deferred'
import { ProjectArchive } from './project-archive'

const mocks = vi.hoisted(() => ({
	Api: {
		ExportProject: vi.fn(),
		PreviewProjectImport: vi.fn(),
		ImportProjectArchive: vi.fn()
	},
	loadProject: vi.fn(),
	stopProjectSubscriptions: vi.fn(),
	setActiveProjectId: vi.fn(),
	requireSettledEdits: vi.fn(),
	uploadToS3: vi.fn(),
	navigate: vi.fn(),
	pending: { value: false }
}))
vi.mock('@/gql-client', () => ({
	Api: mocks.Api,
	setActiveProjectId: mocks.setActiveProjectId
}))
vi.mock('@/state/project', () => ({
	loadProject: mocks.loadProject,
	stopProjectSubscriptions: mocks.stopProjectSubscriptions,
	requireSettledEdits: mocks.requireSettledEdits
}))
vi.mock('@/state/save-status', () => ({ hasPendingEdits: mocks.pending }))
vi.mock('@/components/ui/zod-form/utils', () => ({
	uploadToS3: mocks.uploadToS3
}))
vi.mock('wouter', () => ({ useLocation: () => ['/', mocks.navigate] }))
beforeEach(() => {
	vi.resetAllMocks()
	$currentRole.value = Role.Owner
	$projectChanging.value = false
	mocks.pending.value = false
	mocks.uploadToS3.mockResolvedValue('project_1/upload')
	mocks.Api.PreviewProjectImport.mockResolvedValue({
		name: 'Copy',
		source: 'hash',
		fields: 4,
		values: 6,
		mediaFiles: 2,
		mediaBytes: 2048
	})
	mocks.loadProject.mockResolvedValue(undefined)
})
const review = async () => {
	render(<ProjectArchive />)
	const input = screen.getByLabelText('Import a .groblin.gz project archive')
	fireEvent.change(input, {
		target: { files: [new File(['archive'], 'copy.groblin.gz')] }
	})
	const form = input.closest('form')
	if (!form) throw new Error('Missing archive form')
	fireEvent.submit(form)
	await screen.findByRole('button', { name: 'Confirm new project' })
}

test('archive confirmation waits for acknowledgement, loads the new selection, then navigates', async () => {
	const pending = deferred<number>()
	mocks.Api.ImportProjectArchive.mockReturnValue(pending.promise)
	await review()
	expect(mocks.Api.ImportProjectArchive).not.toHaveBeenCalled()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm new project' }))
	expect($projectChanging.peek()).toBe(true)
	expect(mocks.Api.ImportProjectArchive).toHaveBeenCalledExactlyOnceWith({
		key: 'project_1/upload',
		expectedSource: 'hash',
		name: 'Copy'
	})
	expect(mocks.navigate).not.toHaveBeenCalled()
	await act(async () => pending.resolve(3))
	await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/'))
	expect(mocks.setActiveProjectId).toHaveBeenCalledWith(undefined)
	expect(mocks.loadProject).toHaveBeenCalledOnce()
	expect($projectChanging.peek()).toBe(false)
})

test('failed import retains details and requires another archive review', async () => {
	mocks.Api.ImportProjectArchive.mockRejectedValue(new Error('Archive changed'))
	await review()
	fireEvent.click(screen.getByRole('button', { name: 'Confirm new project' }))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Archive changed'
	)
	expect(
		screen
			.getByRole('button', { name: 'Confirm new project' })
			.hasAttribute('disabled')
	).toBe(true)
	fireEvent.click(
		screen.getByRole('button', { name: 'Refresh archive review' })
	)
	await waitFor(() =>
		expect(
			screen
				.getByRole('button', { name: 'Confirm new project' })
				.hasAttribute('disabled')
		).toBe(false)
	)
	expect(mocks.uploadToS3).toHaveBeenCalledOnce()
	expect(mocks.navigate).not.toHaveBeenCalled()
})

test('exports provide an acknowledged download, with role and pending edit restrictions', async () => {
	mocks.Api.ExportProject.mockResolvedValue({
		filename: 'copy.groblin.gz',
		url: 'https://storage.invalid/archive',
		bytes: 100
	})
	render(<ProjectArchive />)
	fireEvent.click(screen.getByRole('button', { name: 'Prepare export' }))
	expect(
		(
			await screen.findByRole('link', { name: 'Download copy.groblin.gz' })
		).getAttribute('href')
	).toBe('https://storage.invalid/archive')
	mocks.requireSettledEdits.mockImplementation(() => {
		throw new Error('Resolve pending edits')
	})
	fireEvent.click(screen.getByRole('button', { name: 'Prepare export' }))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'pending edits'
	)
	expect(mocks.Api.ExportProject).toHaveBeenCalledOnce()
	act(() => {
		$currentRole.value = Role.Viewer
	})
	expect(screen.queryByRole('button', { name: 'Prepare export' })).toBeNull()
})
