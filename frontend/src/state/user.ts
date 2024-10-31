import { query } from '@/gql-client'
import {
	type LoggedInUser,
	type Login,
	LoginDocument,
	RegisterDocument,
	type Registration
} from '@/gql/graphql'
import { setItem } from '@/lib/local-storage'
import { signal } from '@preact/signals-react'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { debug } from '@shared/utils/ramda'
import gql from 'graphql-tag'
import { pipe, prop } from 'ramda'

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

export const register = (data: Registration): Promise<boolean> =>
	query(RegisterDocument, { data }).then(prop('register'))

export const login = (data: Login) =>
	query(LoginDocument, { data })
		.then(prop('login'))
		.then(
			evolveAlt({
				token: setItem('token'),
				date: pipe(debug, prop('expiresDate'), setItem('tokenExpiresDate'))
			})
		)
