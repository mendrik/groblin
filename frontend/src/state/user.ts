import { query } from '@/gql-client'
import { RegisterDocument, type Registration } from '@/gql/graphql'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'

type User = {
	id: number
	name: string
	email: string
}

export const $user = signal<User | null>(null)

gql`
  mutation Register($data: Registration!) {
    register(data: $data)
  }
`

export const register = (data: Registration): Promise<number> => {
	return query(RegisterDocument, {
		data
	}).then(x => x.register)
}
