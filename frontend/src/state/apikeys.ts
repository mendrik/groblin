import type { ApiKey } from '@/gql/graphql'
import { signal } from '@preact/signals-react'

export const $apiKeys = signal<ApiKey[]>([])
