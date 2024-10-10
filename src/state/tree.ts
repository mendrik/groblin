import { type DocumentType, type GetNodesDocument, graphql } from '@/gql'
import {} from '@/gql'
import { subscribe } from '@/gql-client'
import { type TreeOf, listToTree } from '@/lib/ramda/toTree'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals'
import { pipe, propOr, tap } from 'ramda'

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

export const $root = signal<TreeOf<Node, 'nodes'>>()

subscribe(
	GetNodesQuery,
	pipe(
		propOr([], 'node'),
		listToTree<Node, 'nodes'>('id', 'node_id', 'nodes'),
		setSignal($root)
	)
)
