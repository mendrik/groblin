import type { DocumentType } from '@/gql'
import { subscribe } from '@/gql-client'
import type { GetNodesDocument } from '@/gql/graphql'
import { getItem, setItem } from '@/lib/local-storage'
import { findNextElement, findPrevElement } from '@/lib/ramda'
import { type TreeOf, listToTree } from '@/lib/tree'
import { setSignal } from '@/lib/utils'
import type { ResultOf } from '@graphql-typed-document-node/core'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import {
	toString as asStr,
	equals,
	lensProp,
	mergeDeepLeft,
	over,
	pipe,
	prop
} from 'ramda'
import type { ForwardedRef } from 'react'
import { type FocusableElement, tabbable } from 'tabbable'

const query = gql`
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
/** ---- types ---- **/
type Node = DocumentType<typeof GetNodesDocument>['node'][number]
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
subscribe<ResultOf<typeof GetNodesDocument>>(
	query,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)

$nodes.subscribe(setItem('tree-state'))

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
		if (ref && 'current' in ref && ref.current) ref.current.focus()
	}

const updateNodeState = (nodeId: number, state: Partial<NodeState>) => {
	$nodes.value = over(
		lensProp(asStr(nodeId)),
		mergeDeepLeft(state),
		$nodes.value
	)
}

const focusedNodeState = (state: Partial<NodeState>) => {
	if ($focusedNode.value) {
		updateNodeState($focusedNode.value, state)
	}
}

const selectNextNode = (tree: HTMLElement | null) => {
	if (tree) {
		const tabbables = tabbable(tree)
		const current = tabbables.find(equals(document.activeElement))
		findNextElement<FocusableElement>(equals(current))(tabbables)?.focus()
	}
}

const selectPreviousNode = (tree: HTMLElement | null) => {
	if (tree) {
		const tabbables = tabbable(tree)
		const current = tabbables.find(equals(document.activeElement))
		findPrevElement<FocusableElement>(equals(current))(tabbables)?.focus()
	}
}

/** ---- exports ---- **/
export {
	$isEditingNode,
	$nodes,
	$root,
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
	type TreeNode
}
