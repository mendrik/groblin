import { Api, Subscribe } from '@/gql-client'
import type { ApiKey, CreateApiKey } from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { $location } from '@/routing/route-observer'
import { signal } from '@preact/signals-react'
import {} from 'ramda'

export const $apiKeys = signal<ApiKey[]>([])
export const $abort = signal<AbortController>()

const loadApiKeys = () => Api.GetApiKeys().then(setSignal($apiKeys))

export const subscribeToApiKeys = () => {
	$abort.value?.abort()
	$abort.value = Subscribe.ApiKeysUpdated({}, loadApiKeys)
}

$location.subscribe(loc => {
	if (loc === '/api-keys') {
		subscribeToApiKeys()
		loadApiKeys()
	} else {
		$abort.value?.abort()
	}
})

export const createApiKey = (data: CreateApiKey) => Api.CreateApiKey({ data })
export const deleteApiKey = (key: string) => Api.DeleteApiKey({ key })
export const toggleApiKey = (key: string) => Api.ToggleApiKey({ key })
