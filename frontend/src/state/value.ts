import { computed, signal } from '@preact/signals-react'
import { assertThat } from '@shared/asserts'
import { toDate } from 'date-fns'
import {
	assoc,
	groupBy,
	head,
	isEmpty,
	isNotNil,
	keys,
	omit,
	pipe,
	pluck,
	propEq,
	sortBy,
	unless,
	values,
	when
} from 'ramda'
import { isNilOrEmpty, isNonEmptyArray } from 'ramda-adjunct'
import {
	DeletionKind,
	type InsertListItem,
	NodeType,
	type UpsertValue,
	type Value
} from '@/gql/graphql'
import { Api, Subscribe } from '@/gql-client'
import { notNil, setSignal, updateSignal } from '@/lib/signals'
import { requireEdit } from './access'
import { requestDeletion } from './deletion'
import { createValueSaveQueue } from './save-queue'
import { $focusedNode, $nodesMap, asNode, pathTo, type TreeNode } from './tree'

export type NodeId = number
export type ParentListId = number
export type ActiveLists = Record<NodeId, Value>

export const $values = signal<Value[]>([])
export const $valueMap = signal<Record<NodeId, Value[]>>({})
export const $activeListItems = signal<ActiveLists>({})
export const $lastValueUpdate = signal<Date>(new Date())

$values.subscribe(values => {
	const grouped = groupBy(value => String(value.node_id), values)
	$valueMap.value = Object.fromEntries(
		Object.entries(grouped).map(([key, items]) => [
			key,
			sortBy(value => value.order, items ?? [])
		])
	)
})

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

let valuesGeneration = 0
const fetchValues = async () => {
	const generation = valuesGeneration
	const ids = pipe(values, pluck('id'))(notNil($activeListItems))
	const rows = await Api.GetValues({ data: { ids } })
	if (generation === valuesGeneration) $values.value = rows
}

let valuesSubscription: AbortController | undefined
export const stopValuesSubscription = () => {
	valuesGeneration++
	valuesSubscription?.abort()
}
export const subscribeToValues = () => {
	stopValuesSubscription()
	valuesSubscription = Subscribe.ValuesUpdated({}, fetchValues)
	return valuesSubscription
}

$activeListItems.subscribe(unless(isEmpty, fetchValues))

export const activateListItem = (item: Value) => {
	const node = asNode(item.node_id)
	assertThat(propEq(NodeType.List, 'type'), node, 'Value is not a list item')
	updateSignal($activeListItems, assoc(item.node_id, item))
}

export const activePath = (node: TreeNode): number[] | undefined => {
	const res = [...pathTo(node)]
		.slice(0, -1)
		.filter(node => node.type === NodeType.List)
		.map(node => $activeListItems.value[node.id]?.id)
		.filter(isNotNil)
	return isEmpty(res) ? undefined : res
}

export const $activePath = computed(() => {
	if (!$focusedNode.value) {
		return undefined
	}
	const node = asNode($focusedNode.value)
	return activePath(node)
})

export const insertListItem = (listItem: InsertListItem) => {
	requireEdit()
	return Api.InsertListItem({ listItem })
}

export const focusListItem = async (id: number) => {
	const ids = [
		...Object.values($activeListItems.peek()).map(item => item.id),
		id
	]
	const items = await Api.GetValues({ data: { ids } })
	$values.value = items
	const item = items.find(item => item.id === id)
	if (item) activateListItem(item)
}

export const deleteListItem = (value: Value): Promise<boolean> => {
	requireEdit()
	return requestDeletion(
		{ kind: DeletionKind.Value, id: value.id },
		expectedImpact => Api.DeleteListItem({ id: value.id, expectedImpact })
	)
}

export const truncateList = (node: TreeNode): Promise<boolean> => {
	requireEdit()
	return requestDeletion(
		{ kind: DeletionKind.NodeValues, id: node.id },
		expectedImpact =>
			Api.TruncateList({ data: { node_id: node.id, expectedImpact } })
	)
}

export const selectAnyListItem = (value: Value) => {
	const current = $activeListItems.value[value.node_id]
	if (!current) {
		return
	}
	const values = $valueMap.value[value.node_id]?.filter(
		({ id }) => id !== current.id
	)
	if (isNonEmptyArray(values)) {
		activateListItem(values[0])
	}
}

export const valueSaves = createValueSaveQueue({
	storage: window.localStorage,
	key: data =>
		`${data.node_id}:${(data.list_path ?? []).join(',')}${$nodesMap.peek()[data.node_id]?.type === NodeType.List ? `:${data.id ?? 'new'}` : ''}`,
	send: data => Api.UpsertValue({ data }),
	read: async data => {
		const values = await Api.GetValues({ data: { ids: data.list_path ?? [] } })
		return values.find(value =>
			data.id != null
				? value.id === data.id
				: value.node_id === data.node_id &&
					JSON.stringify(value.list_path ?? []) ===
						JSON.stringify(data.list_path ?? [])
		)
	},
	onSaved: value => {
		const previous = $values.peek().find(item => item.id === value.id)
		if (!previous || previous.revision <= value.revision)
			$values.value = [
				...$values.peek().filter(item => item.id !== value.id),
				value
			]
	}
})
export const saveValue = (data: UpsertValue) => {
	requireEdit()
	return valueSaves.save(data, asNode(data.node_id).name)
}
export const stageValue = (data: UpsertValue) => {
	requireEdit()
	return valueSaves.stage(data, asNode(data.node_id).name)
}
export const valueDraft = (
	nodeId: number,
	path: number[] | undefined,
	id?: number
) =>
	valueSaves.edits.value.find(
		edit =>
			edit.data.node_id === nodeId &&
			JSON.stringify(edit.data.list_path ?? []) ===
				JSON.stringify(path ?? []) &&
			($nodesMap.peek()[nodeId]?.type !== NodeType.List || edit.data.id === id)
	)?.data
export const deleteValue = (id: number) => {
	requireEdit()
	return requestDeletion({ kind: DeletionKind.Value, id }, expectedImpact =>
		Api.DeleteValue({ id, expectedImpact })
	)
}
