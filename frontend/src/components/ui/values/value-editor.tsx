import { NodeType, type Value } from '@/gql/graphql'
import { type TreeNode, pathTo } from '@/state/tree'
import { $activeListItems, activePath, saveValue } from '@/state/value'
import { caseOf, match } from '@shared/utils/match'
import { pipeAsync } from '@shared/utils/pipe-async'
import { type Pred, T as _, any, dropLast, filter, ifElse, pipe } from 'ramda'
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

type InnerValue<T> = T extends { value: infer V } ? V : never

type ValueEditorProps<T> = {
	node: TreeNode
	value?: T
	save: (value: InnerValue<T>) => Promise<number>
}

export type ValueEditor<T> = (props: ValueEditorProps<T>) => ReactNode

type Args = readonly [TreeNode, ViewContext]
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

const matcher = match<Args, ValueEditor<any> | null>(
	caseOf([isBlank, _], null),
	caseOf([{ type: NodeType.List }, ViewContext.Tree], () => ListEditor),
	caseOf([{ type: NodeType.List }, ViewContext.List], () => null),
	caseOf([{ type: NodeType.Object }, _], () => null),
	caseOf([{ type: NodeType.Boolean }, _], () => BooleanEditor),
	caseOf([{ type: NodeType.String }, _], () => StringEditor),
	caseOf([{ type: NodeType.Color }, _], () => ColorEditor),
	caseOf([{ type: NodeType.Number }, _], () => NumberEditor),
	caseOf([{ type: NodeType.Date }, _], () => DateEditor),
	caseOf([_, _], () => null)
)

export const editorKey = (node: TreeNode, value?: Value) =>
	value
		? `${value.id}-${value.updated_at}`
		: `${node.id}-${activePath(node)?.join('-')}`

type OwnProps = {
	node: TreeNode
	view?: ViewContext
	value: Value[]
	listPath: number[] | undefined
}

export const ValueEditor = ({
	node,
	value,
	view = ViewContext.Tree,
	listPath = []
}: OwnProps) => {
	const save: ValueEditorProps<any>['save'] = pipeAsync(
		<C,>(typeValue?: C) => ({
			value: typeValue,
			node_id: node.id,
			id: value?.[0]?.id,
			list_path: listPath
		}),
		saveValue
	)

	const EditorCmp = matcher(node, view)
	return (
		EditorCmp && (
			<EditorCmp
				node={node}
				value={isList(node) ? value : value?.[0]}
				save={save}
			/>
		)
	)
}
