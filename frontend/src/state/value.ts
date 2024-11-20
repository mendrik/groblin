import { Api, Subscribe } from '@/gql-client'
import type { InsertListItem, Value } from '@/gql/graphql'
import { notNil, setSignal, updateSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { assoc, groupBy, pipe, pluck, propOr, values } from 'ramda'
import { $project } from './project'

type NodeId = number

export const $values = signal<Value[]>([])
export const $valueMap = signal<Record<NodeId, Value[]>>({})
export const $activeItems = signal<Record<NodeId, Value>>({})

$values.subscribe(pipe(groupBy(propOr(0, 'node_id')), setSignal($valueMap)))

const fetchValues = () =>
	Api.GetValues({ ids: pipe(notNil, values, pluck('id'))($activeItems) }).then(
		setSignal($values)
	)

export const subscribeToValues = () =>
	Subscribe.ValuesUpdated({ projectId: notNil($project).id }, fetchValues)

export const activateListItem = (item: Value) => {
	updateSignal($activeItems, assoc(item.node_id, item))
	fetchValues()
}

export const insertListItem = (listItem: InsertListItem) =>
	Api.InsertListItem({ listItem })

export const focusListItem = (params: any) => {}

export const deleteListItem = (params: any) => {}
