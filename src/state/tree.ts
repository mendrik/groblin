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
import { findNextElement, findPrevElement } from '@/lib/ramda'
import { type TreeOf, listToTree } from '@/lib/tree'
import { assertExists, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { Maybe, MaybeAsync } from 'purify-ts'
import {
	toString as asStr,
	equals,
	filter,
	isNotEmpty,
	isNotNil,
	lensProp,
	mergeDeepLeft,
	over,
	pipe,
	prop,
	when
} from 'ramda'
import { delayP } from 'ramda-adjunct'
import type { ForwardedRef } from 'react'
import { type FocusableElement, tabbable } from 'tabbable'

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
export const $nodes = signal<Record<string, NodeState>>(
	getItem('tree-state', {})
)
export const $focusedNode = signal<number>()
export const $lastFocusedNode = signal<number>()
export const $isEditingNode = signal<number | undefined>()

/** ---- subscriptions ---- **/
subscribe(
	GetNodesDocument,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)

$nodes.subscribe(setItem('tree-state'))
$focusedNode.subscribe(when(isNotNil, setSignal($lastFocusedNode)))

const $rootUpdates = signal(0)
$root.subscribe(() => ($rootUpdates.value = ($rootUpdates.value + 1) % 1000))

export const waitForUpdate = () =>
	new Promise(res => {
		const current = $rootUpdates.value
		const unsub = $rootUpdates.subscribe(val => {
			if (val !== current) {
				unsub()
				res(val)
			}
		})
	})

/** ---- interfaces ---- **/
export const startEditing = () =>
	($isEditingNode.value = $focusedNode.value ?? $lastFocusedNode.value)
export const notEditing = () => $isEditingNode.value === undefined
export const stopEditing = () => ($isEditingNode.value = undefined)

export const removeFocusedNode = () => setFocusedNode(undefined)

export const setFocusedNode = (nodeId: number | undefined) =>
	($focusedNode.value = nodeId)

export const focusOn =
	<EL extends HTMLElement>(ref: ForwardedRef<EL>) =>
	(): Promise<void> =>
		delayP(20).then(() => {
			if (ref && 'current' in ref && ref.current) ref.current.focus()
		})

export const updateNodeState = (nodeId: number, state: Partial<NodeState>) => {
	$nodes.value = over(
		lensProp(asStr(nodeId)),
		mergeDeepLeft(state),
		$nodes.value
	)
}

export const focusedNodeState = (state: Partial<NodeState>) =>
	Maybe.fromNullable($focusedNode.value).ifJust(nodeId =>
		updateNodeState(nodeId, state)
	)

export const confirmNodeName = (value: string) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable($isEditingNode.value))
		.filter(isNotEmpty)
		.map(id => query(UpdateNodeNameDocument, { id, name: value }))
		.run()

export const deleteNode = (id: number | undefined) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable(id))
		.map(id => query(DeleteNodeDocument, { id }))
		.run()

export const insertNode = (object: Node_Insert_Input) =>
	query(Insert_NodeDocument, { object })

const skippables = (el: FocusableElement) => !el.classList.contains('no-focus')

export const selectNextNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(filter(skippables))
		.map(findNextElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

export const selectPreviousNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(filter(skippables))
		.map(findPrevElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

function* iterateNodes(root: TreeNode): Generator<TreeNode> {
	// Yield the current node
	yield root

	// Recursively iterate through child nodes
	for (const child of root.nodes) {
		yield* iterateNodes(child)
	}
}

export const parentOf = (node_id: number | undefined): number => {
	assertExists(node_id, 'parentOf needs a valid node_id')
	assertExists($root.value, 'Root node is missing')
	for (const node of iterateNodes($root.value)) {
		if (node.nodes.some(n => n.id === node_id)) return node.id
	}
	throw new Error(`Parent for node id ${node_id} not found`)
}
