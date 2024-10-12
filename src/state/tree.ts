import type { DocumentType } from '@/gql'
import { subscribe } from '@/gql-client'
import type { GetNodesDocument } from '@/gql/graphql'
import { getItem, setItem } from '@/lib/local-storage'
import { type TreeOf, listToTree } from '@/lib/tree'
import { setSignal } from '@/lib/utils'
import type { ResultOf } from '@graphql-typed-document-node/core'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { pipe, prop } from 'ramda'

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
}

export const $nodes = signal<Record<string, NodeState>>(
	getItem('tree-state') ?? {}
)

$nodes.subscribe(setItem('tree-state'))

export const updateNodeState = (node: Node, state: Partial<NodeState>) => {
	$nodes.value = {
		...$nodes.value,
		[node.id]: { ...$nodes.value[node.id], ...state }
	}
}
