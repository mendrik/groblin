import { NodeType, type Value } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeItems } from '@/state/value'
import type { Fn } from '@tp/functions'
import { type Pred, T as _, any, apply, filter, pipe, tap } from 'ramda'
import type { FC, ReactNode } from 'react'
import { ListEditor } from './list-editor'

type OwnProps = {
	node: TreeNode
	value?: Value
}

type Args = readonly [TreeNode, Value | undefined]
const isList: Pred<[TreeNode]> = node => node.type === NodeType.List

const notActive: Pred<[TreeNode]> = node =>
	$activeItems.value[node.id] === undefined

const isBlank: Pred<[TreeNode]> = pipe(
	pathTo,
	filter(isList),
	tap(list => {
		console.log('list', list)
		console.log('activeItems', $activeItems.value)
	}),
	any(notActive)
)

const matcher = match<Args, ReactNode>(
	caseOf([{ type: NodeType.List }, _], node => <ListEditor node={node} />),
	caseOf([isBlank, _], () => 'blank'),
	caseOf([_, _], node => <div className="ml-1">{node.name}</div>)
)

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
