import { Role } from '@shared/project-roles'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { NodeType } from '@/gql/graphql'
import { $currentRole } from '@/state/access'
import { deferred } from '../../../../tests/deferred'
import { MediaEditor } from './media-editor'

const mocks = vi.hoisted(() => ({ uploadMedia: vi.fn() }))
vi.mock('@/lib/upload-file', () => mocks)
vi.mock('./value-editor', () => ({ editorKey: () => 'media' }))
const node = {
	id: 11,
	name: 'Photo',
	type: NodeType.Media,
	revision: 1,
	order: 0,
	depth: 2,
	parent_id: 10,
	nodes: []
}
const media = {
	file: 'project_1/sealed',
	name: 'photo.png',
	contentType: 'image/png',
	size: 100,
	width: 1,
	height: 1
}
const value = {
	id: 100,
	node_id: 11,
	revision: 1,
	order: 0,
	list_path: [],
	updated_at: '2026-09-30T00:00:00Z',
	value: { ...media, name: 'Existing file' }
}
beforeEach(() => {
	vi.resetAllMocks()
	$currentRole.value = Role.Editor
})
const choose = () =>
	fireEvent.change(screen.getByLabelText('Upload Photo'), {
		target: { files: [new File(['bytes'], 'photo.png', { type: 'image/png' })] }
	})

test('media editor waits for verification and save acknowledgement and retains errors beside the existing file', async () => {
	const upload = deferred<typeof media>(),
		saved = deferred<number>()
	mocks.uploadMedia.mockReturnValue(upload.promise)
	const save = vi.fn().mockReturnValue(saved.promise)
	render(<MediaEditor node={node} value={value} save={save} />)
	choose()
	expect(save).not.toHaveBeenCalled()
	await act(async () => upload.resolve(media))
	expect(save).toHaveBeenCalledExactlyOnceWith(media)
	expect(screen.getByLabelText('Upload Photo').hasAttribute('disabled')).toBe(
		true
	)
	await act(async () => saved.reject(new Error('Disconnected while saving')))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Disconnected while saving'
	)
	expect(screen.getByText('Existing file')).toBeDefined()
})

test('cancellation preserves the existing file and discarded upload results never save', async () => {
	const upload = deferred<typeof media>()
	mocks.uploadMedia.mockReturnValue(upload.promise)
	const save = vi.fn()
	render(<MediaEditor node={node} value={value} save={save} />)
	choose()
	const signal = mocks.uploadMedia.mock.calls[0]?.[1].signal
	fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }))
	expect(signal?.aborted).toBe(true)
	await act(async () => upload.resolve(media))
	await waitFor(() => expect(save).not.toHaveBeenCalled())
	expect(screen.getByText('Existing file')).toBeDefined()
})
