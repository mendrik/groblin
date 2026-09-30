import { signal } from '@preact/signals-react'
import type {
	Invite,
	ProjectInvitation,
	ProjectUser,
	Role
} from '@/gql/graphql'
import { Api, Subscribe } from '@/gql-client'
import { $canManage } from './access'
import { refreshWorkspace } from './project'

export const $users = signal<ProjectUser[]>([])
export const $invitations = signal<ProjectInvitation[]>([])
export const $usersError = signal<string>()
let abort: AbortController | undefined
let generation = 0

export const loadUsers = async () => {
	const current = generation
	if (!$canManage.peek()) return
	const [users, invitations] = await Promise.all([
		Api.GetUsers(),
		Api.GetInvitations()
	])
	if (current === generation) {
		$users.value = users
		$invitations.value = invitations
	}
}
export const startUsers = () => {
	stopUsers()
	const current = generation
	const refresh = async () => {
		try {
			await loadUsers()
			if (current === generation) $usersError.value = undefined
		} catch (error) {
			if (current === generation)
				$usersError.value =
					error instanceof Error ? error.message : 'Could not load members.'
		}
	}
	abort = Subscribe.UsersUpdated({}, refresh)
	void refresh()
}
export const stopUsers = () => {
	generation++
	abort?.abort()
	$users.value = []
	$invitations.value = []
}

export const inviteUser = async (invite: Invite) => {
	const created = await Api.InviteUser({ invite })
	await loadUsers()
	return created
}
export const deleteUser = async (id: string) => {
	const removed = await Api.DeleteUser({ id })
	await loadUsers()
	return removed
}
export const updateUserRole = async (
	id: string,
	role: Role,
	expectedRole: Role
) => {
	await Api.UpdateUserRole({ id, role, expectedRole })
	await refreshWorkspace()
	await loadUsers()
}
export const revokeInvitation = async (id: number) => {
	await Api.RevokeInvitation({ id })
	await loadUsers()
}
export const transferOwnership = async (userId: string) => {
	await Api.TransferProjectOwnership({ userId })
	await refreshWorkspace()
	await loadUsers()
}
