import { query, subscribe } from '@/gql-client'
import {
	GetNodesDocument,
	type GetNodesSubscription,
	UpdateNodeNameDocument
} from '@/gql/graphql'
import { getItem, setItem } from '@/lib/local-storage'
import { findNextElement, findPrevElement } from '@/lib/ramda'
import { type TreeOf, listToTree } from '@/lib/tree'
import { setSignal } from '@/lib/utils'
import type { Fn } from '@/type-patches/functions'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { Maybe } from 'purify-ts'
import {
	toString as asStr,
	equals,
	isNotEmpty,
	lensProp,
	mergeDeepLeft,
	over,
	pipe,
	prop,
	propOr
} from 'ramda'
import type { ForwardedRef } from 'react'
import { tabbable } from 'tabbable'

gql`
subscription GetNodes {     
	node {
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

/** ---- types ---- **/
type Node = GetNodesSubscription['node'][number]
type TreeNode = TreeOf<Node, 'nodes'>
type NodeState = {
	open: boolean
	selected: boolean
}

/** ---- state ---- **/
const $root = signal<TreeNode>()
const $nodes = signal<Record<string, NodeState>>(getItem('tree-state') ?? {})
const $focusedNode = signal<number>()
const $isEditingNode = signal<number | undefined>()

/** ---- subscriptions ---- **/
subscribe(
	GetNodesDocument,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)

$nodes.subscribe(setItem('tree-state'))

const waitForUpdate = () => {
	let unsub: Fn<never, void>
	return new Promise(res => {
		unsub = $root.subscribe(res)
	}).then(() => unsub())
}

/** ---- interfaces ---- **/
const startEditing = () => ($isEditingNode.value = $focusedNode.value)
const notEditing = () => $isEditingNode.value === undefined
const stopEditing = () => ($isEditingNode.value = undefined)
const removeFocusedNode = () => setFocusedNode(undefined)

const setFocusedNode = (nodeId: number | undefined) =>
	($focusedNode.value = nodeId)

const returnFocus =
	<EL extends HTMLElement>(ref: ForwardedRef<EL>) =>
	() => {
		console.log(propOr(undefined, 'current', ref))

		if (ref && 'current' in ref && ref.current) ref.current.focus()
	}

const updateNodeState = (nodeId: number, state: Partial<NodeState>) => {
	$nodes.value = over(
		lensProp(asStr(nodeId)),
		mergeDeepLeft(state),
		$nodes.value
	)
}

const focusedNodeState = (state: Partial<NodeState>) =>
	Maybe.fromNullable($focusedNode.value).ifJust(nodeId => {
		updateNodeState(nodeId, state)
	})

const confirmNodeName = (value: string) =>
	Maybe.fromNullable($isEditingNode.value)
		.filter(isNotEmpty)
		.map(id =>
			Promise.all([
				query(UpdateNodeNameDocument, { id, name: value }),
				waitForUpdate()
			])
		)

const selectNextNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(findNextElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

const selectPreviousNode = (tree: HTMLElement | null) =>
	Maybe.fromNullable(tree)
		.map(tabbable)
		.map(findPrevElement(equals(document.activeElement)))
		.chain(Maybe.fromNullable)
		.ifJust(e => e instanceof HTMLElement && e.focus())

/** ---- exports ---- **/
export {
	$isEditingNode,
	$nodes,
	$root,
	confirmNodeName,
	focusedNodeState,
	removeFocusedNode,
	selectNextNode,
	selectPreviousNode,
	updateNodeState,
	setFocusedNode,
	notEditing,
	returnFocus,
	startEditing,
	stopEditing,
	waitForUpdate,
	type TreeNode
}
