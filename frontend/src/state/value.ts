import { Api, Subscribe } from '@/gql-client'
import {
	type InsertListItem,
	NodeType,
	type UpsertValue,
	type Value
} from '@/gql/graphql'
import { setSignal } from '@/lib/signals'
import { updateSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { assertThat } from '@shared/asserts'
import { toDate } from 'date-fns'
import {
	assoc,
	groupBy,
	head,
	isEmpty,
	isNotNil,
	keys,
	map,
	omit,
	pipe,
	pluck,
	propEq,
	propOr,
	sortBy,
	unless,
	values,
	when
} from 'ramda'
import { isNilOrEmpty, isNonEmptyArray } from 'ramda-adjunct'
import { $project } from './project'
import { type TreeNode, asNode, pathTo } from './tree'

export type NodeId = number
export type ParentListId = number
export type ActiveLists = Record<NodeId, Value>

export const $values = signal<Value[]>([])
export const $valueMap = signal<Record<NodeId, Value[]>>({})
export const $activeListItems = signal<ActiveLists>({})
export const $lastValueUpdate = signal<Date>(new Date())

$lastValueUpdate.subscribe(console.log)

$values.subscribe(
	pipe(
		groupBy(propOr(0, 'node_id')),
		map(sortBy<Value>(propOr(0, 'order'))),
		setSignal($valueMap)
	)
)

$values.subscribe(
	pipe(
		pluck('updated_at'),
		sortBy(toDate),
		head,
		when(d => d !== $lastValueUpdate.peek(), setSignal($lastValueUpdate))
	)
)

$valueMap.subscribe(valueMap => {
	for (const nodeId of keys($activeListItems.peek())) {
		if (isNilOrEmpty(valueMap[nodeId])) {
			updateSignal($activeListItems, omit([nodeId]))
		}
	}
})

const fetchValues = () => {
	const ids = pipe(values, pluck('id'))(notNil($activeListItems))
	Api.GetValues({ data: { ids } }).then(setSignal($values))
}

export const subscribeToValues = () =>
	Subscribe.ValuesUpdated({ projectId: notNil($project, 'id') }, fetchValues)

$activeListItems.subscribe(unless(isEmpty, fetchValues))

export const activateListItem = (item: Value) => {
	const node = asNode(item.node_id)
	assertThat(propEq(NodeType.List, 'type'), node, 'Value is not a list item')
	updateSignal($activeListItems, assoc(item.node_id, item))
}

export const activePath = (node: TreeNode): number[] | undefined => {
	const res = [...pathTo(node)]
		.slice(0, -1)
		.filter(node => node.type === 'list')
		.map(node => $activeListItems.value[node.id]?.id)
		.filter(isNotNil)
	return isEmpty(res) ? undefined : res
}

export const insertListItem = (listItem: InsertListItem) =>
	Api.InsertListItem({ listItem })

export const focusListItem = (params: any) => {}

export const deleteListItem = (node: TreeNode): Promise<boolean> => {
	const selected = notNil($activeListItems, node.id)
	return Api.DeleteListItem({ id: selected.id })
}

export const truncateList = (node: TreeNode): Promise<number> =>
	Api.TruncateList({ data: { node_id: node.id } }).then(() => node.id)

export const selectAnyListItem = (node: TreeNode) => {
	const current = $activeListItems.value[node.id]
	if (!current) {
		return
	}
	const values = $valueMap.value[node.id]?.filter(({ id }) => id !== current.id)
	if (isNonEmptyArray(values)) {
		activateListItem(values[0])
	}
}

export const saveValue = (data: UpsertValue) => Api.UpsertValue({ data })
