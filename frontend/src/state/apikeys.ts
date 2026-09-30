import { signal } from '@preact/signals-react'
import type { ApiKey, CreateApiKey } from '@/gql/graphql'
import { Api, Subscribe } from '@/gql-client'
import { $canManage } from './access'

export const $apiKeys = signal<ApiKey[]>([])
export const $apiKeysError = signal<string>()
let abort: AbortController | undefined
let generation = 0
const loadApiKeys = async () => {
	const current = generation
	try {
		const keys = await Api.GetApiKeys()
		if (current === generation) {
			$apiKeys.value = keys
			$apiKeysError.value = undefined
		}
	} catch (error) {
		if (current === generation)
			$apiKeysError.value =
				error instanceof Error ? error.message : 'Could not load API keys.'
	}
}
export const stopApiKeys = () => {
	generation++
	abort?.abort()
	$apiKeys.value = []
	$apiKeysError.value = undefined
}
export const startApiKeys = () => {
	stopApiKeys()
	if (!$canManage.peek()) return
	abort = Subscribe.ApiKeysUpdated({}, loadApiKeys)
	void loadApiKeys()
}
export const createApiKey = async (data: CreateApiKey) => {
	const result = await Api.CreateApiKey({ data })
	await loadApiKeys()
	return result
}
export const deleteApiKey = async (key: string) => {
	await Api.DeleteApiKey({ key })
	await loadApiKeys()
}
export const toggleApiKey = async (key: string) => {
	await Api.ToggleApiKey({ key })
	await loadApiKeys()
}
