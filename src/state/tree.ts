import { query, subscribe } from '@/gql-client'
import {
	DeleteNodeDocument,
	GetNodesDocument,
	type GetNodesSubscription,
	UpdateNodeNameDocument
} from '@/gql/graphql'
import { getItem, setItem } from '@/lib/local-storage'
import { findNextElement, findPrevElement } from '@/lib/ramda'
import { type TreeOf, listToTree } from '@/lib/tree'
import { setSignal } from '@/lib/utils'
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

/** ---- types ---- **/
type Node = GetNodesSubscription['node'][number]
type TreeNode = TreeOf<Node, 'nodes'>
type NodeState = {
	open: boolean
	selected: boolean
}

/** ---- state ---- **/
const $root = signal<TreeNode>()
const $nodes = signal<Record<string, NodeState>>(getItem('tree-state', {}))
const $focusedNode = signal<number>()
const $lastFocusedNode = signal<number>()
const $isEditingNode = signal<number | undefined>()

/** ---- subscriptions ---- **/
subscribe(
	GetNodesDocument,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)

$nodes.subscribe(setItem('tree-state'))
$focusedNode.subscribe(when(isNotNil, setSignal($lastFocusedNode)))

const $rootUpdates = signal(0)
$root.subscribe(() => ($rootUpdates.value = ($rootUpdates.value + 1) % 1000))

const waitForUpdate = () =>
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
const startEditing = () =>
	($isEditingNode.value = $focusedNode.value ?? $lastFocusedNode.value)
const notEditing = () => $isEditingNode.value === undefined
const stopEditing = () => ($isEditingNode.value = undefined)

const removeFocusedNode = () => setFocusedNode(undefined)

const setFocusedNode = (nodeId: number | undefined) =>
	($focusedNode.value = nodeId)

const focusOn =
	<EL extends HTMLElement>(ref: ForwardedRef<EL>) =>
	(): Promise<void> =>
		delayP(20).then(() => {
			if (ref && 'current' in ref && ref.current) ref.current.focus()
		})

const updateNodeState = (nodeId: number, state: Partial<NodeState>) => {
	$nodes.value = over(
		lensProp(asStr(nodeId)),
		mergeDeepLeft(state),
		$nodes.value
	)
}

const focusedNodeState = (state: Partial<NodeState>) =>
	Maybe.fromNullable($focusedNode.value).ifJust(nodeId =>
		updateNodeState(nodeId, state)
	)

const confirmNodeName = (value: string) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable($isEditingNode.value))
		.filter(isNotEmpty)
		.map(id => query(UpdateNodeNameDocument, { id, name: value }))
		.run()

const deleteNode = (id: number | undefined) =>
	MaybeAsync.liftMaybe(Maybe.fromNullable(id))
		.map(id => query(DeleteNodeDocument, { id }))
		.run()

const skippables = (el: FocusableElement) => !el.classList.contains('no-focus')

const selectNextNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(filter(skippables))
		.map(findNextElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

const selectPreviousNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(filter(skippables))
		.map(findPrevElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

/** ---- exports ---- **/
export {
	$isEditingNode,
	$nodes,
	$focusedNode,
	$lastFocusedNode,
	$root,
	confirmNodeName,
	deleteNode,
	focusedNodeState,
	focusOn,
	notEditing,
	removeFocusedNode,
	selectNextNode,
	selectPreviousNode,
	setFocusedNode,
	startEditing,
	stopEditing,
	updateNodeState,
	waitForUpdate,
	type TreeNode
}
