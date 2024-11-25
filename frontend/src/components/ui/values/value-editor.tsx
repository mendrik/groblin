import { NodeType, type Value } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeItems, listPath } from '@/state/value'
import type { Fn } from '@tp/functions'
import {
	type Pred,
	T as _,
	any,
	apply,
	dropLast,
	filter,
	head,
	pipe
} from 'ramda'
import type { FC, ReactNode } from 'react'
import { ListEditor } from './list-editor'
import { StringEditor } from './string-editor'

type OwnProps = {
	node: TreeNode
	value: Value[]
}

type Args = readonly [TreeNode, Value[] | undefined]
const isList: Pred<[TreeNode]> = node => node.type === NodeType.List

const notActive: Pred<[TreeNode]> = node =>
	$activeItems.value[node.id] === undefined

const isBlank: Pred<[TreeNode]> = pipe(
	pathTo,
	dropLast(1),
	filter(isList),
	any(notActive)
)

const matcher = match<Args, ReactNode>(
	caseOf([isBlank, _], () => null),
	caseOf([{ type: NodeType.List }, _], (node, value) => (
		<ListEditor node={node} value={value} />
	)),
	caseOf([{ type: NodeType.String }, _], (node, value) => (
		<StringEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([_, _], node => <div className="ml-1">{node.name}</div>)
)

export const editorKey = (node: TreeNode) =>
	`${node.id}-${listPath(node)?.join('-')}`

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
