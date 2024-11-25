import { Api, Subscribe } from '@/gql-client'
import {
	type InsertListItem,
	NodeType,
	type UpsertValue,
	type Value
} from '@/gql/graphql'
import { notNil, setSignal, updateSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { assertThat } from '@shared/asserts'
import {
	assoc,
	groupBy,
	head,
	isEmpty,
	isNotEmpty,
	isNotNil,
	map,
	omit,
	pipe,
	pluck,
	propEq,
	propOr,
	sortBy,
	values
} from 'ramda'
import { $project } from './project'
import { type TreeNode, asNode, pathTo } from './tree'

export type NodeId = number
export type ParentListId = number
export type ActiveLists = Record<NodeId, Value>

export const $values = signal<Value[]>([])
export const $valueMap = signal<Record<NodeId, Value[]>>({})
export const $activeItems = signal<ActiveLists>({})

$values.subscribe(
	pipe(
		groupBy(propOr(0, 'node_id')),
		map(sortBy<Value>(propOr(0, 'order'))),
		setSignal($valueMap)
	)
)
const fetchValues = () => {
	const ids = pipe(values, pluck('id'))(notNil($activeItems))
	Api.GetValues({ data: { ids } }).then(setSignal($values))
}

export const subscribeToValues = () =>
	Subscribe.ValuesUpdated({ projectId: notNil($project, 'id') }, fetchValues)

$activeItems.subscribe(fetchValues)

export const activateListItem = (item: Value) => {
	const node = asNode(item.node_id)
	assertThat(propEq(NodeType.List, 'type'), node, 'Value is not a list item')
	updateSignal($activeItems, assoc(item.node_id, item))
}

export const listPath = (node: TreeNode): number[] | undefined => {
	const res = [...pathTo(node)]
		.filter(node => node.type === 'list')
		.map(node => $activeItems.value[node.id]?.id)
		.filter(isNotNil)
	return isEmpty(res) ? undefined : res
}

export const insertListItem = (listItem: InsertListItem) =>
	Api.InsertListItem({ listItem })

export const focusListItem = (params: any) => {}

export const deleteListItem = (node: TreeNode): Promise<boolean> => {
	const selected = notNil($activeItems, node.id)
	return Api.DeleteListItem({ id: selected.id })
}

export const selectAnyListItem = (node: TreeNode) => {
	const current = notNil($activeItems, node.id)
	const values = notNil($valueMap, node.id).filter(
		({ id }) => id !== current.id
	)

	if (isNotEmpty(values)) {
		activateListItem(head(values))
	} else {
		updateSignal($activeItems, omit([node.id]))
	}
}

export const saveValue = (data: UpsertValue) => Api.UpsertValue({ data })
