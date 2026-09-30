import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type DeletionImpact, DeletionKind } from '@/gql/graphql'
import { $deleting, cancelDeletion, requestDeletion } from '@/state/deletion'
import { deferred } from '../../../tests/deferred'
import { DeletionDialog } from './deletion-dialog'

const { preview } = vi.hoisted(() => ({ preview: vi.fn() }))
vi.mock('@/gql-client', () => ({ Api: { GetDeletionImpact: preview } }))
const impact = (fingerprint = 'first'): DeletionImpact => ({
	fingerprint,
	name: 'Entries',
	fields: 3,
	values: 8,
	listItems: 2,
	mediaFiles: 1,
	fieldNames: ['Entries', 'Title', 'Photo']
})
const target = { kind: DeletionKind.Node, id: 12 }
beforeEach(() => {
	preview.mockReset()
	$deleting.value = false
	cancelDeletion()
})
afterEach(() => {
	$deleting.value = false
	cancelDeletion()
})

const open = (perform = vi.fn().mockResolvedValue(true)) => {
	let result: Promise<boolean> = Promise.resolve(false)
	act(() => {
		result = requestDeletion(target, perform)
	})
	return { result, perform }
}

test('loads impact before enabling deletion and cancel performs no mutation', async () => {
	const pending = deferred<DeletionImpact>()
	preview.mockReturnValue(pending.promise)
	render(<DeletionDialog />)
	const { result, perform } = open()
	expect(
		screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
	).toBe(true)
	await act(async () => pending.resolve(impact()))
	expect(
		screen.getByText(
			/3 fields, 8 stored values, 2 list items and 1 media files/
		)
	).toBeDefined()
	expect(
		screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
	).toBe(false)
	fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
	expect(await result).toBe(false)
	expect(perform).not.toHaveBeenCalled()
})

test('stays open while deleting, prevents duplicate submission and waits for acknowledgement', async () => {
	preview.mockResolvedValue(impact())
	const pending = deferred<boolean>()
	render(<DeletionDialog />)
	const { result, perform } = open(vi.fn().mockReturnValue(pending.promise))
	await waitFor(() =>
		expect(
			screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
		).toBe(false)
	)
	fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
	expect(
		screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')
	).toBe(true)
	fireEvent.click(screen.getByRole('button', { name: 'Deleting…' }))
	expect(perform).toHaveBeenCalledExactlyOnceWith('first')
	await act(async () => pending.resolve(true))
	expect(await result).toBe(true)
	expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('a conflict refreshes impact and requires a second explicit confirmation', async () => {
	preview
		.mockResolvedValueOnce(impact())
		.mockResolvedValueOnce({ ...impact('updated'), values: 9 })
	const perform = vi
		.fn()
		.mockRejectedValueOnce(
			new Error('Content changed. Review the updated impact.')
		)
		.mockResolvedValueOnce(true)
	render(<DeletionDialog />)
	const { result } = open(perform)
	await waitFor(() =>
		expect(
			screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
		).toBe(false)
	)
	fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
	await screen.findByText(/3 fields, 9 stored values/)
	expect(screen.getByRole('alert').textContent).toContain('Content changed')
	expect(perform).toHaveBeenCalledTimes(1)
	fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
	await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
	expect(await result).toBe(true)
	expect(perform).toHaveBeenNthCalledWith(2, 'updated')
})

test('a failed preview keeps deletion disabled and offers a retry', async () => {
	preview
		.mockRejectedValueOnce(new Error('Disconnected'))
		.mockResolvedValueOnce(impact())
	render(<DeletionDialog />)
	const { result, perform } = open()
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Disconnected'
	)
	expect(
		screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
	).toBe(true)
	fireEvent.click(screen.getByRole('button', { name: 'Retry preview' }))
	await waitFor(() =>
		expect(
			screen.getByRole('button', { name: 'Delete' }).hasAttribute('disabled')
		).toBe(false)
	)
	fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
	expect(await result).toBe(false)
	expect(perform).not.toHaveBeenCalled()
})
