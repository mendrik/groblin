import { query, subscribe } from '@/gql-client'
import {
	DeleteNodeDocument,
	GetNodesDocument,
	type GetNodesSubscription,
	Insert_NodeDocument,
	type Node_Insert_Input,
	UpdateNodeNameDocument
} from '@/gql/graphql'
import { getItem, setItem } from '@/lib/local-storage'
import { type TreeOf, listToTree } from '@/lib/tree'
import { assertExists, failOnNil, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { Maybe, MaybeAsync } from 'purify-ts'
import {
	type NonEmptyArray,
	aperture,
	toString as asStr,
	find,
	head,
	isNotEmpty,
	isNotNil,
	last,
	lensProp,
	mergeDeepLeft,
	over,
	pipe,
	prop,
	when
} from 'ramda'
import {} from 'tabbable'

/** ---- queries ---- **/
gql`
subscription GetNodes {     
	node( order_by: { id: asc }) {
		id
		name
		node_id
		type
		order
	}
}
`

gql`
mutation updateNodeName($id: Int!, $name: String!) {
	update_node_by_pk (
	pk_columns: { id: $id }
	_set: { name: $name }
	) { 
		id
	}
}
`

gql`
mutation deleteNode($id: Int!) {
	delete_node_by_pk (
		id: $id
	) {
		id
	}
}
`

gql`
mutation insert_node($object: node_insert_input!) {
  	insert_node_one(object: $object) {
    	id
	}
}
`

/** ---- types ---- **/
export type Node = GetNodesSubscription['node'][number]
export type TreeNode = TreeOf<Node, 'nodes'>
type NodeState = {
	open: boolean
	selected: boolean
}

/** ---- state ---- **/
export const $root = signal<TreeNode>()
export const $nodeStates = signal<Record<string, NodeState>>(
	getItem('tree-state', {})
)

export const $previousNode = signal<number>()
export const $focusedNode = signal<number>()
export const $nextNode = signal<number>()
export const $parentNode = signal<number>()
export const $editingNode = signal<number | undefined>()

/** ---- subscriptions ---- **/
subscribe(
	GetNodesDocument,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)
$root.subscribe(
	when(isNotNil, node => updateNodeState({ open: true })(node.id))
)
$nodeStates.subscribe(setItem('tree-state'))
const $rootUpdates = signal(0)
$root.subscribe(() => ($rootUpdates.value = ($rootUpdates.value + 1) % 1000))

export const waitForUpdate = <T>(arg: T): Promise<T> =>
	new Promise<T>(res => {
		const current = $rootUpdates.value
		const unsub = $rootUpdates.subscribe(val => {
			if (val !== current) {
				unsub()
				res(arg)
			}
		})
	})

/** ---- interfaces ---- **/
export const startEditing = () => ($editingNode.value = $focusedNode.value)
export const notEditing = () => $editingNode.value === undefined
export const isOpen = (nodeId: number): boolean =>
	$nodeStates.value[`${nodeId}`]?.open
export const stopEditing = () => ($editingNode.value = undefined)

export const updateCurrentNode = (nodeId: number): number => {
	assertExists($root.value, 'Root node is missing')
	const openNodes = [
		...iterateOpenNodes($root.value)
	] as NonEmptyArray<TreeNode>

	const clampedList = [last(openNodes), ...openNodes, head(openNodes)].map(
		node => node.id
	)

	const findFocused = pipe(
		aperture(3) as (a: number[]) => [number, number, number][],
		find<[number, number, number]>(([_p, curr, _n]) => curr === nodeId)
	)
	const res = findFocused(clampedList)
	if (res != null) {
		const [prev, focused, next] = res
		$previousNode.value = prev
		$focusedNode.value = focused
		$nextNode.value = next
		$parentNode.value = parentOf(focused)
	}
	return nodeId
}

export const focusedNode = (): number => {
	assertExists($focusedNode.value, 'Focused node is missing')
	return $focusedNode.value
}

export const node = (nodeId: number): TreeNode => {
	assertExists($root.value, 'Root node is missing')
	const res = [...iterateNodes($root.value)].find(node => node.id === nodeId)
	assertExists(res, `Node with id ${nodeId} not found`)
	return res
}

export const previousNode = (): number => {
	assertExists($previousNode.value, 'Previous node is missing')
	return $previousNode.value
}

export const nextNode = (): number => {
	assertExists($nextNode.value, 'Next node is missing')
	return $nextNode.value
}

export const parentNode = (): number => {
	assertExists($parentNode.value, 'Parent node is missing')
	return $parentNode.value
}

export const focusNode = (nodeId: number) => {
	const node = document.getElementById(`node-${asStr(nodeId)}`)
	assertExists(node, `Node with id ${nodeId} not found`)
	setTimeout(() => node.focus(), 40)
}

export const refocus = () => {
	const nodeId = focusedNode()
	const node = document.getElementById(`node-${asStr(nodeId)}`)
	assertExists(node, `Node with id ${nodeId} not found`)
	setTimeout(() => node.focus(), 40)
}

export const updateNodeState =
	(state: Partial<NodeState>) => (nodeId: number) => {
		$nodeStates.value = over(
			lensProp(asStr(nodeId)),
			mergeDeepLeft(state),
			$nodeStates.value
		)
		updateCurrentNode(nodeId)
	}

export const nodeState = (state: Partial<NodeState>) =>
	Maybe.fromNullable($focusedNode.value).ifJust(updateNodeState(state))

export const openNode = updateNodeState({ open: true })
export const closeNode = updateNodeState({ open: false })

export const confirmNodeName = (value: string) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable($editingNode.value))
		.filter(isNotEmpty)
		.map(id => query(UpdateNodeNameDocument, { id, name: value }))
		.run()

export const deleteNode = (id: number) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable(id))
		.map(id => query(DeleteNodeDocument, { id }))
		.run()

export const insertNode = (object: Node_Insert_Input): Promise<number> =>
	query(Insert_NodeDocument, { object })
		.then(x => x.insert_node_one?.id)
		.then(failOnNil('Failed to insert node'))

function* iterateNodes(root: TreeNode): Generator<TreeNode> {
	yield root
	for (const child of root.nodes) {
		yield* iterateNodes(child)
	}
}

function* iterateOpenNodes(root: TreeNode): Generator<TreeNode> {
	if (root.id !== $root.value?.id) {
		yield root
	}
	if ($nodeStates.value[root.id]?.open === true) {
		for (const child of root.nodes) {
			yield* iterateOpenNodes(child)
		}
	}
}

export const parentInTree = (
	tree: TreeNode,
	node_id: number | undefined
): number => {
	for (const node of iterateNodes(tree)) {
		if (node.nodes.some(n => n.id === node_id)) return node.id
	}
	throw new Error(`Parent for node id ${node_id} not found`)
}

export const parentOf = (node_id: number | undefined): number => {
	assertExists(node_id, 'parentOf needs a valid node_id')
	assertExists($root.value, 'Root node is missing')
	return parentInTree($root.value, node_id)
}
