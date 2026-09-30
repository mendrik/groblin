import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { $user } from '@/state/user'
import { deferred } from '../../../../tests/deferred'
import { Profile } from './profile'

const mocks = vi.hoisted(() => ({
	updateUser: vi.fn(),
	changePassword: vi.fn(),
	getSession: vi.fn(),
	sendVerificationEmail: vi.fn()
}))
vi.mock('@/lib/auth-client', async importOriginal => ({
	...(await importOriginal<typeof import('@/lib/auth-client')>()),
	...mocks
}))
const user = {
	id: 'user',
	email: 'editor@example.invalid',
	emailVerified: false,
	name: 'Editor',
	createdAt: new Date(),
	updatedAt: new Date()
}
beforeEach(() => {
	vi.resetAllMocks()
	$user.value = user
	mocks.getSession.mockResolvedValue({
		data: { user: { ...user, name: 'New name' } },
		error: null
	})
})

test('profile form submits through its button and waits for the update before reporting success', async () => {
	const pending = deferred<{ data: { status: boolean }; error: null }>()
	mocks.updateUser.mockReturnValue(pending.promise)
	render(<Profile />)
	fireEvent.change(screen.getByLabelText('Name'), {
		target: { value: ' New name ' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
	expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith({ name: 'New name' })
	expect(screen.queryByRole('status')).toBeNull()
	await act(async () =>
		pending.resolve({ data: { status: true }, error: null })
	)
	await screen.findByText('Profile updated.')
	expect($user.peek()?.name).toBe('New name')
})

test('password errors preserve entered values; accepted changes revoke other sessions and clear passwords', async () => {
	mocks.changePassword
		.mockResolvedValueOnce({
			data: null,
			error: { message: 'Wrong current password' }
		})
		.mockResolvedValueOnce({ data: { token: null }, error: null })
	render(<Profile />)
	fireEvent.change(screen.getByLabelText('Current password'), {
		target: { value: 'synthetic-old-password' }
	})
	fireEvent.change(screen.getByLabelText('New password'), {
		target: { value: 'synthetic-new-password' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Wrong current password'
	)
	expect(screen.getByLabelText('New password')).toHaveProperty(
		'value',
		'synthetic-new-password'
	)
	fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
	await screen.findByText(
		'Password changed. Other sessions have been signed out.'
	)
	expect(mocks.changePassword).toHaveBeenLastCalledWith({
		currentPassword: 'synthetic-old-password',
		newPassword: 'synthetic-new-password',
		revokeOtherSessions: true
	})
	expect(screen.getByLabelText('New password')).toHaveProperty('value', '')
})

test('unverified accounts can request verification and delivery errors remain visible', async () => {
	mocks.sendVerificationEmail
		.mockResolvedValueOnce({
			data: null,
			error: { message: 'Email delivery failed' }
		})
		.mockResolvedValueOnce({ data: { status: true }, error: null })
	render(<Profile />)
	fireEvent.click(
		screen.getByRole('button', { name: 'Send verification email' })
	)
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Email delivery failed'
	)
	fireEvent.click(
		screen.getByRole('button', { name: 'Send verification email' })
	)
	await screen.findByText('Verification email sent.')
	await waitFor(() =>
		expect(mocks.sendVerificationEmail).toHaveBeenLastCalledWith({
			email: user.email,
			callbackURL: '/profile'
		})
	)
})
