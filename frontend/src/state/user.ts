import { query } from '@/gql-client'
import {
	type LoggedinUser,
	type Login,
	LoginDocument,
	RegisterDocument,
	type Registration
} from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { prop } from 'ramda'

export const $user = signal<LoggedinUser>()

gql`
  mutation Register($data: Registration!) {
    register(data: $data)
  }
`

gql`
  mutation Login($data: Login!) {
    login(data: $data) {
		id
		token
		name
		email			
	}
  }
`

export const register = (data: Registration): Promise<boolean> =>
	query(RegisterDocument, { data }).then(prop('register'))

export const login = (data: Login): Promise<LoggedinUser> =>
	query(LoginDocument, { data }).then(prop('login')).then(setSignal($user))
