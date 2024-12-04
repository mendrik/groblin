import { Api, Subscribe } from '@/gql-client'
import type { NodeSettings, UpsertNodeSettings } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { groupBy, head, map, pipe, propOr } from 'ramda'
import { $project } from './project'
import {} from './tree'

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
