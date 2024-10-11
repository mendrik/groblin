import type { DocumentType } from '@/gql'
import { subscribe } from '@/gql-client'
import type { GetNodesDocument } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import type { ResultOf } from '@graphql-typed-document-node/core'
import { signal } from '@preact/signals-react'
import gql from 'graphql-tag'
import { evolve, map, pipe, pluck, prop } from 'ramda'

const query = gql`
	subscription GetNodes {     
		node {
			id
			name
			nodes(order_by: { order: asc }) { id }
			type
			order
		}
  	}
`

type Node = DocumentType<typeof GetNodesDocument>['node'][number]
export type TreeNode = Omit<Node, 'nodes'> & { nodes: number[] }

export const $root = signal<TreeNode[]>()

subscribe<ResultOf<typeof GetNodesDocument>>(
	query,
	pipe(
		prop('node'),
		map(
			evolve({
				nodes: pluck('id')
			})
		),
		setSignal($root)
	)
)
