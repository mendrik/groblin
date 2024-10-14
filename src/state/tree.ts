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
import type { SyntheticEvent } from 'react'
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

type Node = DocumentType<typeof GetNodesDocument>['node'][number]
export type TreeNode = TreeOf<Node, 'nodes'>

export const $root = signal<TreeNode>()

subscribe<ResultOf<typeof GetNodesDocument>>(
	query,
	pipe(prop('node'), listToTree('id', 'node_id', 'nodes'), setSignal($root))
)

type NodeState = {
	open: boolean
	selected: boolean
}

export const $nodes = signal<Record<string, NodeState>>(
	getItem('tree-state') ?? {}
)
$nodes.subscribe(setItem('tree-state'))

export const $focusedNode = signal<number>()
export const setFocusedNode = (nodeId: number | undefined) => {
	$focusedNode.value = nodeId
}

export const $isEditingNode = signal<number | undefined>()
export const setEditing = (nodeId: number | undefined) => {
	$isEditingNode.value = nodeId
	if (nodeId === undefined) {
		setFocusedNode(undefined)
	}
}

export const updateNodeState = (nodeId: number, state: Partial<NodeState>) => {
	$nodes.value = over(
		lensProp(asStr(nodeId)),
		mergeDeepLeft(state),
		$nodes.value
	)
}

export const returnFocus =
	(nodeId: number) =>
	<E extends SyntheticEvent>(e: E): E => {
		if (e.target instanceof HTMLElement) {
			const tree = e.target.closest('.tree')
			setTimeout(() => {
				const node = tree?.querySelector(`.node[data-node_id="${nodeId}"]`)
				if (node instanceof HTMLElement) {
					node.focus()
				}
			}, 30)
		}
		return e
	}

export const focusedNodeState = (state: Partial<NodeState>) => {
	if ($focusedNode.value) {
		updateNodeState($focusedNode.value, state)
	}
}

export const selectNextNode = (tree: HTMLElement | null) => {
	if (tree) {
		const tabbables = tabbable(tree)
		const current = tabbables.find(equals(document.activeElement))
		findNextElement<FocusableElement>(equals(current))(tabbables)?.focus()
	}
}

export const selectPreviousNode = (tree: HTMLElement | null) => {
	if (tree) {
		const tabbables = tabbable(tree)
		const current = tabbables.find(equals(document.activeElement))
		findPrevElement<FocusableElement>(equals(current))(tabbables)?.focus()
	}
}
