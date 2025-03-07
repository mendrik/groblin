import type { LoggedInUser } from '@/gql/graphql'
import { signal } from '@preact/signals-react'

export const $user = signal<LoggedInUser>()


