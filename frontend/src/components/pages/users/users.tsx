import { useSignalEffect } from '@preact/signals-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { $canManage } from '@/state/access'
import { $project } from '@/state/project'
import {
	$invitations,
	$usersError,
	revokeInvitation,
	startUsers,
	stopUsers
} from '@/state/users'
import { Page } from '../page'
import { UserTable } from './table'
import { openUserInvite, UserInvite } from './user-invite'

export function Users() {
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string>()
	useSignalEffect(() => {
		if ($canManage.value && $project.value) startUsers()
		return stopUsers
	})
	return (
		<Page>
			<div className="flex gap-2">
				<h1 className="flex-grow">Project members</h1>
				<Button variant="secondary" onClick={openUserInvite}>
					Invite member…
				</Button>
			</div>
			{($usersError.value || error) && (
				<p role="alert">{error ?? $usersError.value}</p>
			)}
			<UserTable />
			<UserInvite />
			<h2>Invitations</h2>
			<p>
				Create another invitation for the same email to replace an expired or
				lost link. The previous link is revoked.
			</p>
			<ul className="space-y-2">
				{$invitations.value.map(invitation => {
					const status = invitation.accepted_at
						? 'Accepted'
						: invitation.revoked_at
							? 'Revoked'
							: new Date(invitation.expires_at) <= new Date()
								? 'Expired'
								: 'Pending'
					return (
						<li key={invitation.id} className="flex gap-2 items-center">
							<span className="flex-1">
								{invitation.email} · {invitation.role} · {status}
							</span>
							{status === 'Pending' && (
								<Button
									variant="secondary"
									disabled={busy}
									onClick={() => {
										setBusy(true)
										setError(undefined)
										void revokeInvitation(invitation.id)
											.catch(error =>
												setError(
													error instanceof Error
														? error.message
														: 'Revocation failed.'
												)
											)
											.finally(() => setBusy(false))
									}}
								>
									Revoke
								</Button>
							)}
						</li>
					)
				})}
			</ul>
		</Page>
	)
}
