import { Api, Subscribe } from '@/gql-client'
import { setSignal } from '@/lib/signals'
import { $location } from '@/routing/route-observer'
import { signal } from '@preact/signals-react'
import {} from 'ramda'

export const $users = signal<User[]>([])
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

export const inviteUser = (data: Invite) => Api.InviteUser({ data })
export const deleteUser = (id: number) => Api.DeleteUser({ id })
