import { NodeType, type Value } from '@/gql/graphql'
import { inputValue } from '@/lib/dom-events'
import { caseOf, match } from '@/lib/match'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeItems, listPath, saveValue } from '@/state/value'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipeAsync } from '@shared/utils/pipe-async'
import type { Fn } from '@tp/functions'
import {
	type Pred,
	T as _,
	any,
	apply,
	dropLast,
	filter,
	head,
	objOf,
	pipe
} from 'ramda'
import type { FC, ReactNode } from 'react'
import { BooleanEditor } from './boolean-editor'
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
	caseOf([{ type: NodeType.Object }, _], () => null),
	caseOf([{ type: NodeType.List }, _], (node, value) => (
		<ListEditor node={node} value={value} />
	)),
	caseOf([{ type: NodeType.Boolean }, _], (node, value) => (
		<BooleanEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([{ type: NodeType.String }, _], (node, value) => (
		<StringEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([_, _], node => <div className="ml-1">{node.name}</div>)
)

export const editorKey = (node: TreeNode) =>
	`${node.id}-${listPath(node)?.join('-')}`

export const save = <T extends Value>(node: TreeNode, value?: T) =>
	pipeAsync(
		inputValue,
		evolveAlt({
			value: objOf('content'),
			node_id: () => node.id,
			id: () => value?.id,
			list_path: () => listPath(node)
		}),
		saveValue
	)

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
