import { NodeType, type Value } from '@/gql/graphql'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeListItems, activePath, saveValue } from '@/state/value'
import { caseOf, match } from '@shared/utils/match'
import { pipeAsync } from '@shared/utils/pipe-async'
import {
	type Pred,
	T as _,
	any,
	dropLast,
	filter,
	head,
	ifElse,
	pipe
} from 'ramda'
import type { ReactNode } from 'react'
import { BooleanEditor } from './boolean-editor'
import { ColorEditor } from './color-editor'
import { DateEditor } from './date-editor'
import { ListEditor } from './list-editor'
import { NumberEditor } from './number-editor'
import { StringEditor } from './string-editor'

export enum ViewContext {
	Tree = 'tree',
	List = 'list'
}

type OwnProps = {
	node: TreeNode
	view?: ViewContext
	value: Value[]
	listPath: number[] | undefined
}

type Args = readonly [TreeNode, Value[] | undefined, number[], ViewContext]
const isList: Pred<[TreeNode]> = node => node.type === NodeType.List

const notActive: Pred<[TreeNode]> = node =>
	$activeListItems.value[node.id] === undefined

const isBlankField: Pred<[TreeNode]> = pipe(
	pathTo,
	filter(isList),
	any(notActive)
)
const isBlankList: Pred<[TreeNode]> = pipe(
	pathTo,
	filter(isList),
	dropLast(1),
	any(notActive)
)
const isBlank: Pred<[TreeNode]> = ifElse(isList, isBlankList, isBlankField)

const matcher = match<Args, ReactNode>(
	caseOf([isBlank, _], () => null),
	caseOf([{ type: NodeType.List }, _, _, ViewContext.Tree], (node, value) => (
		<ListEditor node={node} value={value} />
	)),
	caseOf([{ type: NodeType.Object }, _, _, _], () => null),
	caseOf([{ type: NodeType.Boolean }, _, _, _], (node, value, listPath) => (
		<BooleanEditor node={node} value={head(value ?? [])} listPath={listPath} />
	)),
	caseOf([{ type: NodeType.String }, _, _, _], (node, value, listPath) => (
		<StringEditor node={node} value={head(value ?? [])} listPath={listPath} />
	)),
	caseOf([{ type: NodeType.Color }, _, _, _], (node, value, listPath) => (
		<ColorEditor node={node} value={head(value ?? [])} listPath={listPath} />
	)),
	caseOf([{ type: NodeType.Number }, _, _, _], (node, value, listPath) => (
		<NumberEditor node={node} value={head(value ?? [])} listPath={listPath} />
	)),
	caseOf([{ type: NodeType.Date }, _, _, _], (node, value, listPath) => (
		<DateEditor node={node} value={head(value ?? [])} listPath={listPath} />
	)),
	caseOf([_, _, _, ViewContext.Tree], node => (
		<div className="ml-1">{node.name}</div>
	)),
	caseOf([_, _, _, ViewContext.List], null)
)

export const editorKey = (node: TreeNode, value?: Value) =>
	value
		? `${value.id}-${value.updated_at}`
		: `${node.id}-${activePath(node)?.join('-')}`

export const save = <T extends Value>(
	node: TreeNode,
	listPath: number[],
	value?: T
) =>
	pipeAsync(
		<C,>(typeValue?: C) => ({
			value: typeValue,
			node_id: node.id,
			id: value?.id,
			list_path: listPath
		}),
		saveValue
	)

export const ValueEditor = ({
	node,
	value,
	view = ViewContext.Tree,
	listPath = []
}: OwnProps) => matcher(node, value, listPath, view)
