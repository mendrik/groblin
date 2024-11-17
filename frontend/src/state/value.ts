import type { Value } from '@/gql/graphql'
import { signal } from '@preact/signals-react'

export const $values = signal<Value[]>([])
