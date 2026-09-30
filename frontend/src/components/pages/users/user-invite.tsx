import { signal } from '@preact/signals-react'
import {
	invitationEmailSchema,
	invitationRoleSchema
} from '@shared/project-roles'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type InviteUserMutation, Role } from '@/gql/graphql'
import { inviteUser } from '@/state/users'

const $dialogOpen = signal(false)
export const openUserInvite = () => {
	$dialogOpen.value = true
}

export const UserInvite = () => {
	const [email, setEmail] = useState('')
	const [role, setRole] = useState(Role.Editor)
	const [created, setCreated] = useState<InviteUserMutation['inviteUser']>()
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string>()
	const [copied, setCopied] = useState(false)
	const close = () => {
		if (!busy) {
			$dialogOpen.value = false
			setCreated(undefined)
			setError(undefined)
			setCopied(false)
		}
	}
	const submit = async () => {
		setBusy(true)
		setError(undefined)
		try {
			const parsed = invitationRoleSchema.parse(role)
			setCreated(
				await inviteUser({
					email: invitationEmailSchema.parse(email),
					role: Role[parsed]
				})
			)
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Invitation failed.')
		} finally {
			setBusy(false)
		}
	}
	return (
		<Dialog open={$dialogOpen.value} onOpenChange={close}>
			<DialogContent close={close} closeButton={!busy}>
				<DialogHeader>
					<DialogTitle>Invite a member</DialogTitle>
					<DialogDescription>
						The recipient can register first, verify their email and accept the
						invitation. The link expires in seven days.
					</DialogDescription>
				</DialogHeader>
				{error && <p role="alert">{error}</p>}
				{created ? (
					<div className="space-y-3">
						<p>
							{created.emailSent
								? 'Invitation email sent.'
								: (created.emailError ?? 'Share this link with the recipient.')}
						</p>
						<label htmlFor="invitation-link">Invitation link</label>
						<Input id="invitation-link" value={created.url} readOnly />
						<Button
							onClick={() => {
								void navigator.clipboard
									.writeText(created.url)
									.then(() => setCopied(true))
									.catch(() =>
										setError('Could not copy. Select and copy the link above.')
									)
							}}
						>
							{copied ? 'Copied' : 'Copy link'}
						</Button>
						<Button variant="secondary" onClick={close}>
							Done
						</Button>
					</div>
				) : (
					<form
						className="space-y-3"
						onSubmit={event => {
							event.preventDefault()
							void submit()
						}}
					>
						<label htmlFor="invite-email">Email</label>
						<Input
							id="invite-email"
							type="email"
							value={email}
							onChange={event => setEmail(event.target.value)}
							required
							disabled={busy}
						/>
						<label htmlFor="invite-role">Role</label>
						<select
							id="invite-role"
							className="border rounded p-2 bg-background"
							value={role}
							disabled={busy}
							onChange={event =>
								setRole(Role[invitationRoleSchema.parse(event.target.value)])
							}
						>
							<option value={Role.Editor}>Editor</option>
							<option value={Role.Viewer}>Viewer</option>
							<option value={Role.Admin}>Administrator</option>
						</select>
						<p>
							Editors change content. Administrators also manage the model,
							members and API keys. Viewers can read content.
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="secondary"
								disabled={busy}
								onClick={close}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={busy}>
								{busy ? 'Creating…' : 'Create invitation'}
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	)
}
