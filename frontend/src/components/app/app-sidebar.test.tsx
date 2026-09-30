import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { disconnect } from '@/gql-client'
import { $user } from '@/state/user'
import { deferred } from '../../../tests/deferred'
import { AppSidebar } from './app-sidebar'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/lib/auth-client', () => ({ signOut }))
vi.mock('../ui/content-history', () => ({ openContentHistory: vi.fn() }))
vi.mock('@/gql-client', () => ({ disconnect: vi.fn() }))

beforeEach(() => {
	vi.resetAllMocks()
	$user.value = {
		id: 'first',
		name: 'First User',
		email: 'first@example.invalid',
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
	localStorage.setItem('tree-state', '{"selected":1}')
})
afterEach(() => {
	vi.restoreAllMocks()
	localStorage.clear()
	$user.value = undefined
})

test('logout closes the connection and clears user and persisted tree before reloading', async () => {
	const closed = deferred<void>()
	vi.mocked(disconnect).mockReturnValue(closed.promise)
	signOut.mockImplementation(
		async (options: { fetchOptions: { onSuccess: () => Promise<void> } }) =>
			options.fetchOptions.onSuccess()
	)
	const replace = vi
		.spyOn(window.location, 'replace')
		.mockImplementation(() => {
			expect($user.value).toBeUndefined()
			expect(localStorage.getItem('tree-state')).toBeNull()
		})
	render(<AppSidebar />)
	fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
	await waitFor(() => expect(disconnect).toHaveBeenCalledOnce())
	expect(replace).not.toHaveBeenCalled()
	await act(async () => closed.resolve())
	await waitFor(() => expect(replace).toHaveBeenCalledExactlyOnceWith('/'))
})

test('unsuccessful logout does not claim the session was cleared', async () => {
	signOut.mockResolvedValue({ data: null, error: { message: 'Offline' } })
	const replace = vi
		.spyOn(window.location, 'replace')
		.mockImplementation(() => {})
	render(<AppSidebar />)
	await act(async () =>
		fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
	)
	expect(signOut).toHaveBeenCalledOnce()
	expect(disconnect).not.toHaveBeenCalled()
	expect(replace).not.toHaveBeenCalled()
	expect($user.value?.id).toBe('first')
	expect(localStorage.getItem('tree-state')).not.toBeNull()
})
