import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	changePassword,
	dataOrError,
	getSession,
	sendVerificationEmail,
	updateUser
} from '@/lib/auth-client'
import { $user } from '@/state/user'
import { Page } from '../page'

export function Profile() {
	const [name, setName] = useState($user.peek()?.name ?? '')
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [error, setError] = useState<string>()
	const [status, setStatus] = useState<string>()
	const [busy, setBusy] = useState(false)
	const run = async (action: () => Promise<unknown>, success: string) => {
		setBusy(true)
		setError(undefined)
		setStatus(undefined)
		try {
			await action()
			setStatus(success)
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: 'Could not update your account.'
			)
		} finally {
			setBusy(false)
		}
	}
	return (
		<Page>
			<h1>Profile</h1>
			{error && <p role="alert">{error}</p>}
			{status && <p role="status">{status}</p>}
			<p>
				{$user.value?.email} ·{' '}
				{$user.value?.emailVerified ? 'Email verified' : 'Email not verified'}
			</p>
			{!$user.value?.emailVerified && (
				<Button
					disabled={busy}
					onClick={() =>
						void run(async () => {
							const user = $user.peek()
							if (!user) throw new Error('Sign in again.')
							dataOrError(
								await sendVerificationEmail({
									email: user.email,
									callbackURL: '/profile'
								})
							)
						}, 'Verification email sent.')
					}
				>
					Send verification email
				</Button>
			)}
			<form
				className="space-y-3 my-4"
				onSubmit={event => {
					event.preventDefault()
					void run(async () => {
						if (!name.trim()) throw new Error('Enter a name.')
						dataOrError(await updateUser({ name: name.trim() }))
						$user.value = dataOrError(
							await getSession({ query: { disableCookieCache: true } })
						).user
					}, 'Profile updated.')
				}}
			>
				<label htmlFor="profile-name">Name</label>
				<Input
					id="profile-name"
					autoComplete="name"
					value={name}
					onChange={event => setName(event.target.value)}
					required
					maxLength={160}
				/>
				<Button type="submit" disabled={busy}>
					Save profile
				</Button>
			</form>
			<h2>Change password</h2>
			<form
				className="space-y-3"
				onSubmit={event => {
					event.preventDefault()
					void run(async () => {
						dataOrError(
							await changePassword({
								currentPassword,
								newPassword,
								revokeOtherSessions: true
							})
						)
						setCurrentPassword('')
						setNewPassword('')
					}, 'Password changed. Other sessions have been signed out.')
				}}
			>
				<label htmlFor="current-password">Current password</label>
				<Input
					id="current-password"
					type="password"
					autoComplete="current-password"
					value={currentPassword}
					onChange={event => setCurrentPassword(event.target.value)}
					required
				/>
				<label htmlFor="new-password">New password</label>
				<Input
					id="new-password"
					type="password"
					autoComplete="new-password"
					value={newPassword}
					onChange={event => setNewPassword(event.target.value)}
					minLength={12}
					maxLength={128}
					required
				/>
				<Button type="submit" disabled={busy}>
					Change password
				</Button>
			</form>
		</Page>
	)
}
