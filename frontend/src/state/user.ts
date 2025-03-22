import { signal } from '@preact/signals-react'
import type { User } from 'better-auth/types'

export const $user = signal<User>()
