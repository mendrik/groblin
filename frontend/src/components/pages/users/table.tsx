import { invitationRoleSchema } from '@shared/project-roles'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { type ProjectUser, Role } from '@/gql/graphql'
import { $isOwner } from '@/state/access'
import {
	$users,
	deleteUser,
	transferOwnership,
	updateUserRole
} from '@/state/users'

export const UserTable = () => {
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string>()
	const [confirm, setConfirm] = useState<{
		user: ProjectUser
		kind: 'remove' | 'transfer'
	}>()
	const run = async (action: () => Promise<unknown>) => {
		setBusy(true)
		setError(undefined)
		try {
			await action()
			setConfirm(undefined)
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Member action failed.')
		} finally {
			setBusy(false)
		}
	}
	return (
		<>
			{error && <p role="alert">{error}</p>}
			<table className="w-full">
				<caption>Confirmed project members</caption>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Role</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{$users.value.map(user => (
						<tr key={user.id}>
							<td>{user.name}</td>
							<td>{user.email}</td>
							<td>
								{user.owner ? (
									'Owner'
								) : (
									<select
										className="bg-background border rounded p-1"
										aria-label={`Role for ${user.name}`}
										value={user.role}
										disabled={busy}
										onChange={event => {
											const role =
												Role[invitationRoleSchema.parse(event.target.value)]
											void run(() => updateUserRole(user.id, role, user.role))
										}}
									>
										<option value={Role.Admin}>Administrator</option>
										<option value={Role.Editor}>Editor</option>
										<option value={Role.Viewer}>Viewer</option>
									</select>
								)}
							</td>
							<td>
								{!user.owner && (
									<div className="flex flex-wrap gap-1">
										<Button
											size="sm"
											variant="secondary"
											disabled={busy}
											onClick={() => setConfirm({ user, kind: 'remove' })}
										>
											Remove
										</Button>
										{$isOwner.value && (
											<Button
												size="sm"
												variant="secondary"
												disabled={busy}
												onClick={() => setConfirm({ user, kind: 'transfer' })}
											>
												Make Owner
											</Button>
										)}
									</div>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{confirm && (
				<div className="border rounded p-3 space-y-2">
					<p>
						{confirm.kind === 'remove'
							? `Remove ${confirm.user.name} from this project?`
							: `Transfer ownership to ${confirm.user.name}? You will become an administrator and only the new Owner can delete the project or transfer ownership.`}
					</p>
					<Button
						variant={confirm.kind === 'remove' ? 'destructive' : 'default'}
						disabled={busy}
						onClick={() =>
							void run(() =>
								confirm.kind === 'remove'
									? deleteUser(confirm.user.id)
									: transferOwnership(confirm.user.id)
							)
						}
					>
						Confirm {confirm.kind === 'remove' ? 'removal' : 'transfer'}
					</Button>
					<Button
						variant="secondary"
						disabled={busy}
						onClick={() => setConfirm(undefined)}
					>
						Cancel
					</Button>
				</div>
			)}
		</>
	)
}
