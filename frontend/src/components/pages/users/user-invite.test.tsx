import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { deferred } from '../../../../tests/deferred'
import { openUserInvite, UserInvite } from './user-invite'

const mocks = vi.hoisted(() => ({ inviteUser: vi.fn() }))
vi.mock('@/state/users', () => mocks)
beforeEach(() => vi.resetAllMocks())
afterEach(() =>
	fireEvent.click(
		screen.queryByRole('button', { name: 'Cancel' }) ??
			screen.queryByRole('button', { name: 'Done' }) ??
			document.body
	)
)
const open = () => {
	render(<UserInvite />)
	act(openUserInvite)
	fireEvent.change(screen.getByLabelText('Email'), {
		target: { value: 'new@example.invalid' }
	})
}

test('invitation form submits and displays an acknowledged link when email delivery fails', async () => {
	const pending = deferred<{
		url: string
		emailSent: boolean
		emailError: string
		invitation: object
	}>()
	mocks.inviteUser.mockReturnValue(pending.promise)
	open()
	fireEvent.click(screen.getByRole('button', { name: 'Create invitation' }))
	expect(mocks.inviteUser).toHaveBeenCalledExactlyOnceWith({
		email: 'new@example.invalid',
		role: 'Editor'
	})
	expect(screen.queryByLabelText('Invitation link')).toBeNull()
	await act(async () =>
		pending.resolve({
			url: 'https://example.invalid/invite/token',
			emailSent: false,
			emailError: 'Could not send email. Share the link.',
			invitation: {}
		})
	)
	await screen.findByText('Could not send email. Share the link.')
	expect(screen.getByLabelText('Invitation link')).toHaveProperty(
		'value',
		'https://example.invalid/invite/token'
	)
})

test('failed invitation creation retains the address and selected role for retry', async () => {
	mocks.inviteUser.mockRejectedValue(new Error('Not authorized'))
	open()
	fireEvent.change(screen.getByLabelText('Role'), {
		target: { value: 'Viewer' }
	})
	fireEvent.click(screen.getByRole('button', { name: 'Create invitation' }))
	expect((await screen.findByRole('alert')).textContent).toContain(
		'Not authorized'
	)
	expect(screen.getByLabelText('Email')).toHaveProperty(
		'value',
		'new@example.invalid'
	)
	await waitFor(() =>
		expect(mocks.inviteUser).toHaveBeenCalledWith({
			email: 'new@example.invalid',
			role: 'Viewer'
		})
	)
})
