import type { DocumentType } from '@/gql'
import { subscribe } from '@/gql-client'
import type { GetNodesDocument } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import type { ResultOf } from '@graphql-typed-document-node/core'
import { signal } from '@preact/signals'
import { evolve, map, pipe, pluck, prop } from 'ramda'
import getNodes from './nodes.gql?raw'

type Node = DocumentType<typeof GetNodesDocument>['node'][number]
export type TreeNode = Omit<Node, 'nodes'> & { nodes: number[] }

export const $root = signal<TreeNode[]>()

subscribe<ResultOf<typeof GetNodesDocument>>(
	getNodes,
	pipe(
		prop('node'),
		map(evolve({ nodes: pluck<number[]>('id') })),
		setSignal($root)
	)
)
