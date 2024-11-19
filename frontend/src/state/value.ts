import type { SelectedListItem, Value } from '@/gql/graphql'
import { signal } from '@preact/signals-react'

export const $values = signal<Value[]>([])

export const $selectedListItems = signal<SelectedListItem[]>([])
