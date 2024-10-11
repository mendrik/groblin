import type { DocumentType, GetNodesDocument } from '@/gql'
import { subscribe } from '@/gql-client'
import { type TreeOf, listToTree } from '@/lib/ramda/toTree'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals'
import { pipe, prop } from 'ramda'

export const GetNodesQuery = `
  subscription GetNodes {    
    node {
      id
      name
      node_id
      type
    }
  }
`

type Node = DocumentType<typeof GetNodesDocument>['node'][number]

export type TreeNode = TreeOf<Node, 'nodes'>

export const $root = signal<TreeNode>()

subscribe(
	GetNodesQuery,
	pipe(
		prop('node'),
		listToTree<Node, 'nodes'>('id', 'node_id', 'nodes'),
		setSignal($root)
	)
)
