import { signal } from '@preact/signals-react'
import { z } from 'zod'
import type { NodeSettings, UpsertNodeSettings } from '@/gql/graphql'
import { Api, Subscribe } from '@/gql-client'
import { requireManage } from './access'
import { createSaveQueue } from './save-queue'

export type NodeId = number

export const $nodeSettings = signal<NodeSettings[]>([])
export const $nodeSettingsMap = signal<Record<NodeId, NodeSettings>>({})

$nodeSettings.subscribe(settings => {
	$nodeSettingsMap.value = Object.fromEntries(
		settings.map(setting => [setting.node_id, setting])
	)
})

let settingsGeneration = 0
export const fetchNodeSettings = async () => {
	const generation = settingsGeneration
	const settings = await Api.GetNodeSttings()
	if (generation === settingsGeneration) $nodeSettings.value = settings
}

let settingsSubscription: AbortController | undefined
export const stopSettingsSubscription = () => {
	settingsGeneration++
	settingsSubscription?.abort()
}
export const subscribeToNodeSettings = () => {
	stopSettingsSubscription()
	settingsSubscription = Subscribe.NodeSettingsUpdated({}, fetchNodeSettings)
	return settingsSubscription
}

const settingsInput = z.strictObject({
	id: z.int().positive().nullish(),
	node_id: z.int().positive(),
	expectedRevision: z.int().nonnegative(),
	settings: z.record(z.string(), z.json())
}) satisfies z.ZodType<UpsertNodeSettings>
export const settingsSaves = createSaveQueue<UpsertNodeSettings, NodeSettings>({
	input: settingsInput,
	storage: window.localStorage,
	key: data => String(data.node_id),
	send: data => Api.UpsertNodeSettings({ data }),
	read: async data =>
		(await Api.GetNodeSttings()).find(row => row.node_id === data.node_id),
	onSaved: saved => {
		$nodeSettings.value = [
			...$nodeSettings.peek().filter(row => row.node_id !== saved.node_id),
			saved
		]
	}
})
export const saveNodeSettings = (data: UpsertNodeSettings) => {
	requireManage()
	return settingsSaves.save(data, 'Field properties')
}
export const stageNodeSettings = (data: UpsertNodeSettings) => {
	requireManage()
	return settingsSaves.stage(data, 'Field properties')
}
