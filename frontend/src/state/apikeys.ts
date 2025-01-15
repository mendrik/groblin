import { Api, Subscribe } from '@/gql-client'
import type { ApiKey } from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'

export const $apiKeys = signal<ApiKey[]>([])
export const $abort = signal<AbortController>()

export const subscribeToApiKeys = () => {
	$abort.value?.abort()
	$abort.value = Subscribe.ApiKeysUpdated({}, () =>
		Api.GetApiKeys().then(setSignal($apiKeys))
	)
}
