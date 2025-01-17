import { Api, Subscribe } from '@/gql-client'
import type { Invite, ProjectUser } from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { $location } from '@/routing/route-observer'
import { signal } from '@preact/signals-react'

export const $users = signal<ProjectUser[]>([])
export const $abort = signal<AbortController>()

const loadUsers = () => Api.GetUsers().then(setSignal($users))

export const subscribeToUsers = () => {
	$abort.value?.abort()
	$abort.value = Subscribe.UsersUpdated({}, loadUsers)
}

$location.subscribe(loc => {
	if (loc === '/api-keys') {
		subscribeToUsers()
		loadUsers()
	} else {
		$abort.value?.abort()
	}
})

export const inviteUser = (invite: Invite) => Api.InviteUser({ invite })
export const deleteUser = (id: number) => Api.DeleteUser({ id })
