import { NodeType, type Value } from '@/gql/graphql'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeListItems, listPath, saveValue } from '@/state/value'
import { caseOf, match } from '@shared/utils/match'
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
	pipe
} from 'ramda'
import type { FC, ReactNode } from 'react'
import { BooleanEditor } from './boolean-editor'
import { ColorEditor } from './color-editor'
import { DateEditor } from './date-editor'
import { ListEditor } from './list-editor'
import { NumberEditor } from './number-editor'
import { StringEditor } from './string-editor'

type OwnProps = {
	node: TreeNode
	value: Value[]
}

type Args = readonly [TreeNode, Value[] | undefined]
const isList: Pred<[TreeNode]> = node => node.type === NodeType.List

const notActive: Pred<[TreeNode]> = node =>
	$activeListItems.value[node.id] === undefined

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
	caseOf([{ type: NodeType.Color }, _], (node, value) => (
		<ColorEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([{ type: NodeType.Number }, _], (node, value) => (
		<NumberEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([{ type: NodeType.Date }, _], (node, value) => (
		<DateEditor node={node} value={head(value ?? [])} />
	)),
	caseOf([_, _], node => <div className="ml-1">{node.name}</div>)
)

export const editorKey = (node: TreeNode, value: Value | undefined) =>
	value?.id ?? `${node.id}-${listPath(node)?.join('-')}`

export const save = <T extends Value>(node: TreeNode, value?: T) =>
	pipeAsync(
		<C,>(typeValue?: C) => ({
			value: typeValue,
			node_id: node.id,
			id: value?.id,
			list_path: listPath(node)
		}),
		saveValue
	)

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
