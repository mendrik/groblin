import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { disconnect } from '@/gql-client'
import {
	requestPasswordReset,
	resetPassword,
	signIn,
	signUp
} from '@/lib/auth-client'
import { loadProject } from '@/state/project'
import { $user } from '@/state/user'
import { deferred } from '../../../../tests/deferred'
import { ForgotPasswordDialog } from './forgot-password'
import { LoginDialog } from './login-dialog'
import { PasswordResetDialog } from './password-reset'
import { RegistrationDialog } from './register-dialog'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@/lib/auth-client', async importOriginal => ({
	...(await importOriginal<typeof import('@/lib/auth-client')>()),
	signIn: { email: vi.fn() },
	signUp: { email: vi.fn() },
	requestPasswordReset: vi.fn(),
	resetPassword: vi.fn()
}))
vi.mock('@/state/project', () => ({ loadProject: vi.fn() }))
vi.mock('@/gql-client', () => ({ disconnect: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('wouter', async importOriginal => ({
	...(await importOriginal<typeof import('wouter')>()),
	useLocation: () => ['/', navigate]
}))
vi.mock('wouter/use-browser-location', async importOriginal => ({
	...(await importOriginal<typeof import('wouter/use-browser-location')>()),
	navigate
}))

const user = {
	id: 'synthetic',
	name: 'Test',
	email: 'test@example.invalid',
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date()
}
const error = {
	message: 'Request rejected',
	status: 400,
	statusText: 'Bad Request'
}
const fill = (label: string, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = (name: string) =>
	fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
	vi.resetAllMocks()
	vi.spyOn(console, 'error').mockImplementation(() => {})
	window.history.replaceState(null, '', '/')
	$user.value = undefined
})
afterEach(() => vi.restoreAllMocks())

test('login trims email while preserving password whitespace and loads project before publishing user', async () => {
	let finish: (() => void) | undefined
	vi.mocked(loadProject).mockImplementation(
		() =>
			new Promise(resolve => {
				finish = resolve
			})
	)
	vi.mocked(signIn.email).mockResolvedValue({
		data: { user, token: 'synthetic', redirect: false },
		error: null
	})
	render(<LoginDialog />)
	fill('Email', '  test@example.invalid  ')
	fill('Password', ' password with spaces ')
	submit('Login')
	await waitFor(() => expect(loadProject).toHaveBeenCalledOnce())
	expect(signIn.email).toHaveBeenCalledWith({
		email: user.email,
		password: ' password with spaces '
	})
	expect($user.value).toBeUndefined()
	await act(async () => finish?.())
	await waitFor(() => expect($user.value).toEqual(user))
	expect(toast.success).toHaveBeenCalledOnce()
})

test('failed login does not load project or leave an authenticated user', async () => {
	vi.mocked(signIn.email).mockResolvedValue({ data: null, error })
	render(<LoginDialog />)
	fill('Email', user.email)
	fill('Password', 'wrong password')
	submit('Login')
	await waitFor(() => expect(toast.error).toHaveBeenCalled())
	expect(loadProject).not.toHaveBeenCalled()
	expect($user.value).toBeUndefined()
	expect(toast.success).not.toHaveBeenCalled()
})

test('registration unlocks after rejection and a retry keeps password spaces and valid callback route', async () => {
	vi.mocked(signUp.email)
		.mockResolvedValueOnce({ data: null, error })
		.mockResolvedValueOnce({ data: { user, token: null }, error: null })
	render(<RegistrationDialog />)
	fill('Name', user.name)
	fill('Email', user.email)
	fill('Password', ' password with spaces ')
	fill('Repeat password', ' password with spaces ')
	submit('Register')
	await waitFor(() => expect(toast.error).toHaveBeenCalled())
	const form = screen.getByLabelText('Name').closest('form')
	expect(form?.getAttribute('data-disabled')).toBeNull()
	expect(navigate).not.toHaveBeenCalled()
	submit('Register')
	await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))
	expect(signUp.email).toHaveBeenLastCalledWith({
		name: user.name,
		email: user.email,
		password: ' password with spaces ',
		callbackURL: '/'
	})
	expect(signUp.email).toHaveBeenCalledTimes(2)
})

test('registration rejects mismatched passwords before making a request', async () => {
	render(<RegistrationDialog />)
	fill('Name', user.name)
	fill('Email', user.email)
	fill('Password', 'first password')
	fill('Repeat password', 'different password')
	submit('Register')
	expect(await screen.findByText('Passwords must match')).toBeDefined()
	expect(signUp.email).not.toHaveBeenCalled()
})

test('forgot password waits for the server before claiming an email was sent', async () => {
	const request = deferred<Awaited<ReturnType<typeof requestPasswordReset>>>()
	vi.mocked(requestPasswordReset).mockReturnValue(request.promise)
	render(<ForgotPasswordDialog />)
	fill('Email', '  test@example.invalid  ')
	submit('Send email')
	await waitFor(() =>
		expect(requestPasswordReset).toHaveBeenCalledWith({
			email: user.email,
			redirectTo: `${window.location.origin}/reset-password`
		})
	)
	expect(toast.success).not.toHaveBeenCalled()
	expect(navigate).not.toHaveBeenCalled()
	await act(async () =>
		request.resolve({ data: { status: true, message: 'Sent' }, error: null })
	)
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Check your email',
			expect.anything()
		)
	)
	expect(navigate).toHaveBeenCalledWith('/')
})

test('forgot password shows failure and allows a retry without a false success message', async () => {
	vi.mocked(requestPasswordReset)
		.mockResolvedValueOnce({ data: null, error })
		.mockResolvedValueOnce({
			data: { status: true, message: 'Sent' },
			error: null
		})
	render(<ForgotPasswordDialog />)
	fill('Email', user.email)
	submit('Send email')
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith(error.message))
	expect(toast.success).not.toHaveBeenCalled()
	expect(navigate).not.toHaveBeenCalled()
	submit('Send email')
	await waitFor(() => expect(toast.success).toHaveBeenCalled())
	expect(requestPasswordReset).toHaveBeenCalledTimes(2)
})

const fillReset = () => {
	fill('Password', ' new password ')
	fill('Repeat password', ' new password ')
	submit('Reset password')
}

test('reset requires a token before contacting the server', async () => {
	render(<PasswordResetDialog />)
	fillReset()
	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			'This reset link is invalid. Request a new one.'
		)
	)
	expect(resetPassword).not.toHaveBeenCalled()
	expect(disconnect).not.toHaveBeenCalled()
})

test('failed reset preserves the form and connection for retry', async () => {
	window.history.replaceState(null, '', '/reset-password?token=expired')
	vi.mocked(resetPassword).mockResolvedValue({ data: null, error })
	const replace = vi
		.spyOn(window.location, 'replace')
		.mockImplementation(() => {})
	render(<PasswordResetDialog />)
	fillReset()
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith(error.message))
	expect(resetPassword).toHaveBeenCalledWith({
		token: 'expired',
		newPassword: ' new password '
	})
	expect(disconnect).not.toHaveBeenCalled()
	expect(replace).not.toHaveBeenCalled()
	expect(toast.success).not.toHaveBeenCalled()
})

test('successful reset disconnects before navigating to a fresh login', async () => {
	window.history.replaceState(null, '', '/reset-password?token=valid')
	vi.mocked(resetPassword).mockResolvedValue({
		data: { status: true },
		error: null
	})
	const closed = deferred<void>()
	vi.mocked(disconnect).mockReturnValue(closed.promise)
	const replace = vi
		.spyOn(window.location, 'replace')
		.mockImplementation(() => {})
	render(<PasswordResetDialog />)
	fillReset()
	await waitFor(() => expect(disconnect).toHaveBeenCalledOnce())
	expect(replace).not.toHaveBeenCalled()
	await act(async () => closed.resolve())
	await waitFor(() => expect(replace).toHaveBeenCalledWith('/'))
	expect(resetPassword).toHaveBeenCalledWith({
		token: 'valid',
		newPassword: ' new password '
	})
})
