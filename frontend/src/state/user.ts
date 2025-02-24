import { Api } from '@/gql-client'
import type {
	ForgotPassword,
	LoggedInUser,
	Login,
	Registration
} from '@/gql/graphql'
import { getItem, removeItems, setItem } from '@/lib/local-storage'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipe, prop } from 'ramda'
import { loadProject } from './project'

export const $user = signal<LoggedInUser>()

export const register = (data: Registration): Promise<boolean> =>
	Api.Register({ data })

export const logout = () => Api.Logout().then(logoutClient)

export const logoutClient = () => {
	removeItems(['token', 'tokenExpiresDate'])
	setSignal($user, null)
}

export const loggedIn = () => getItem('token') != null

export const login = (data: Login) =>
	Api.Login({ data })
		.then(
			evolveAlt({
				token: setItem('token'),
				date: pipe(prop('expiresDate'), setItem('tokenExpiresDate'))
			})
		)
		.then(loadProject)

export const forgotPassword = (data: ForgotPassword) => 
	Api.ForgotPassword({ data })
