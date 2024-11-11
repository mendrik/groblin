import { query } from '@/gql-client'
import {
	type LoggedInUser,
	type Login,
	LoginDocument,
	LogoutDocument,
	RegisterDocument,
	type Registration
} from '@/gql/graphql'
import { getItem, removeItems, setItem } from '@/lib/local-storage'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import gql from 'graphql-tag'
import { pipe, prop } from 'ramda'
import { loadProject } from './project'

export const $user = signal<LoggedInUser>()

gql`
  mutation Register($data: Registration!) {
    register(data: $data)
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

export const logout = () => query(LogoutDocument).then(logoutClient)

export const logoutClient = () => {
	removeItems(['token', 'tokenExpiresDate'])
	setSignal($user, null)
}

export const loggedIn = () => getItem('token') != null

export const login = (data: Login) =>
	query(LoginDocument, { data })
		.then(prop('login'))
		.then(
			evolveAlt({
				token: setItem('token'),
				date: pipe(prop('expiresDate'), setItem('tokenExpiresDate'))
			})
		)
		.then(loadProject)
