import { Api, Subscribe } from '@/gql-client'
import type { NodeSettings, UpsertNodeSettings } from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { groupBy, head, map, pipe, propOr } from 'ramda'
import { $project } from './project'

export type NodeId = number

export const $nodeSettings = signal<NodeSettings[]>([])
export const $nodeSettingsMap = signal<Record<NodeId, NodeSettings>>({})

$nodeSettings.subscribe(
	pipe(groupBy(propOr(0, 'node_id')), map(head), setSignal($nodeSettingsMap))
)

export const fetchNodeSettings = () =>
	Api.GetNodeSttings().then(setSignal($nodeSettings))

export const subscribeToNodeSettings = () =>
	Subscribe.NodeSettingsUpdated(
		{ projectId: notNil($project, 'id') },
		fetchNodeSettings
	)

export const saveNodeSettings = (data: UpsertNodeSettings) =>
	Api.UpsertNodeSettings({ data })

export const settings = <T>(nodeId: NodeId): T | undefined => {
	const settings = $nodeSettingsMap.value[nodeId]
	return settings?.settings
}
