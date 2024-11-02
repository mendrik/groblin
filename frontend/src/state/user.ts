import { query } from '@/gql-client'
import {
	type LoggedInUser,
	type Login,
	LoginDocument,
	LogoutDocument,
	RegisterDocument,
	type Registration,
	WhoAmIDocument
} from '@/gql/graphql'
import { removeItems, setItem } from '@/lib/local-storage'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import gql from 'graphql-tag'
import { pipe, prop } from 'ramda'

export const $user = signal<LoggedInUser>()

gql`
  mutation Register($data: Registration!) {
    register(data: $data)
  }
`

gql`
  query WhoAmI {
    whoami {
		id
		email
		name		
	}
  }
`

gql`
  mutation Login($data: Login!) {
    login(data: $data) {
		token
		expiresDate
	}
  }
`

gql`
  mutation Logout {
    logout
  }
`

export const register = (data: Registration): Promise<boolean> =>
	query(RegisterDocument, { data }).then(prop('register'))

export const whoAmI = () =>
	query(WhoAmIDocument)
		.then(prop('whoami'))
		.then(setSignal($user))
		.catch(logoutClient)

export const logout = () => query(LogoutDocument).then(whoAmI)

export const logoutClient = () => {
	removeItems(['token', 'tokenExpiresDate'])
	setSignal($user, null)
}

export const login = (data: Login) =>
	query(LoginDocument, { data })
		.then(prop('login'))
		.then(
			evolveAlt({
				token: setItem('token'),
				date: pipe(prop('expiresDate'), setItem('tokenExpiresDate'))
			})
		)
		.then(whoAmI)
