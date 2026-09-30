import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import type { GetInvitationQuery } from '@/gql/graphql'
import { Api } from '@/gql-client'
import {
	dataOrError,
	getSession,
	sendVerificationEmail
} from '@/lib/auth-client'
import { clearInvitationReturn, rememberInvitation } from '@/routing/return-to'
import { acceptInvitation } from '@/state/project'
import { hasPendingEdits } from '@/state/save-status'
import { $user } from '@/state/user'
import { Page } from '../page'

export function Invitation({ token }: { token: string }) {
	const [, navigate] = useLocation()
	const [preview, setPreview] = useState<GetInvitationQuery['getInvitation']>()
	const [error, setError] = useState<string>()
	const [busy, setBusy] = useState(false)
	const [sent, setSent] = useState(false)
	useEffect(() => {
		rememberInvitation(`/invite/${token}`)
		let active = true
		void Api.GetInvitation({ token })
			.then(preview => {
				if (active) setPreview(preview)
			})
			.catch(error => {
				if (active)
					setError(
						error instanceof Error
							? error.message
							: 'Invitation is unavailable.'
					)
			})
		return () => {
			active = false
		}
	}, [token])
	const run = async (action: () => Promise<unknown>) => {
		setBusy(true)
		setError(undefined)
		try {
			await action()
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Could not accept invitation.'
			)
		} finally {
			setBusy(false)
		}
	}
	return (
		<Page>
			<h1>Project invitation</h1>
			{error && <p role="alert">{error}</p>}
			{!preview && !error && <p role="status">Loading invitation…</p>}
			{preview && (
				<>
					<p>
						You’re invited to <strong>{preview.project_name}</strong> as{' '}
						{preview.role}, using {preview.email}.
					</p>
					<p>
						The invitation expires{' '}
						{new Date(preview.expires_at).toLocaleString()}.
					</p>
					{$user.value?.email.toLowerCase() !== preview.email ? (
						<p>Sign out and sign in with {preview.email} to accept.</p>
					) : (
						<>
							{!$user.value?.emailVerified && (
								<>
									<p>Verify your email before joining this project.</p>
									<Button
										disabled={busy}
										onClick={() =>
											void run(async () => {
												dataOrError(
													await sendVerificationEmail({
														email: preview.email,
														callbackURL: `/invite/${token}`
													})
												)
												setSent(true)
											})
										}
									>
										Send verification email
									</Button>
									{sent && (
										<p role="status">
											Verification email sent. Return to this invitation after
											verifying.
										</p>
									)}
								</>
							)}
							{hasPendingEdits.value && (
								<p>
									Save or resolve your pending edits before joining and opening
									this project.
								</p>
							)}
							<Button
								disabled={busy || hasPendingEdits.value}
								onClick={() =>
									void run(async () => {
										const session = dataOrError(
											await getSession({ query: { disableCookieCache: true } })
										)
										$user.value = session.user
										await acceptInvitation(token)
										clearInvitationReturn()
										navigate('/')
									})
								}
							>
								{busy
									? 'Joining…'
									: preview.accepted
										? 'Open project'
										: 'Accept invitation'}
							</Button>
						</>
					)}
				</>
			)}
		</Page>
	)
}
