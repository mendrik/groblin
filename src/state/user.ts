import { signal } from '@preact/signals-react'

type User = {
	id: number
	name: string
	email: string
}

export const $user = signal<User | null>(null)
