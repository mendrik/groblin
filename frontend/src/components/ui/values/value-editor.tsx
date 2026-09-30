import { caseOf, match } from 'matchblade'
import {
	T as _,
	any,
	dropLast,
	equals,
	filter,
	ifElse,
	type Pred,
	pipe
} from 'ramda'
import { type ReactNode, useState } from 'react'
import { record, string, unknown } from 'zod'
import { type NodeSettings, NodeType, type Value } from '@/gql/graphql'
import { pathTo, type TreeNode } from '@/state/tree'
import {
	$activeListItems,
	activePath,
	saveValue,
	stageValue,
	valueDraft
} from '@/state/value'
import { BooleanEditor } from './boolean-editor'
import { ColorEditor } from './color-editor'
import { DateEditor } from './date-editor'
import { ListEditor } from './list-editor'
import { NumberEditor } from './number-editor'
import { StringEditor } from './string-editor'

import './value-editor.css'
import { $canEdit } from '@/state/access'
import { $nodeSettingsMap } from '@/state/node-settings'
import { ArticleEditor } from './article-editor'
import { ChoiceEditor } from './choice-editor'
import { MediaEditor } from './media-editor'

export enum ViewContext {
	Tree = 'tree',
	List = 'list'
}

type InnerValue<T> = T extends { value: infer V } ? V : never

type ValueEditorProps<T, S = NodeSettings['settings']> = {
	node: TreeNode
	settings?: S
	value?: T
	save: (value: InnerValue<T>) => Promise<number>
	stage?: (value: InnerValue<T>) => void
}

export type ValueEditor<T, S = NodeSettings['settings']> = (
	props: ValueEditorProps<T, S>
) => ReactNode

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
	caseOf([{ type: NodeType.Media }, _], () => MediaEditor),
	caseOf([{ type: NodeType.Choice }, _], () => ChoiceEditor),
	caseOf([{ type: NodeType.Article }, _], () => ArticleEditor),
	caseOf([_, _], () => null)
)

export const editorKey = (node: TreeNode, value?: Value) =>
	value && value.id > 0
		? `${value.id}-${value.revision}`
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
	const [saveError, setSaveError] = useState<string>()
	const settings = $nodeSettingsMap.value[node.id]?.settings
	const draft = valueDraft(node.id, listPath, value?.[0]?.id)
	const currentValue = value?.[0]
	const displayedValue = draft
		? {
				...currentValue,
				id: draft.id ?? 0,
				node_id: node.id,
				order: currentValue?.order ?? 0,
				list_path: listPath,
				updated_at: currentValue?.updated_at ?? '',
				revision: draft.expectedRevision,
				value: draft.value
			}
		: currentValue
	const toInput = (content: Record<string, unknown>) => ({
		value: content,
		node_id: node.id,
		id: draft?.id ?? currentValue?.id,
		expectedRevision: draft?.expectedRevision ?? currentValue?.revision ?? 0,
		list_path: listPath
	})
	const stage = (input: unknown) => {
		stageValue(toInput(record(string(), unknown()).parse(input)))
	}

	const save = async (input: unknown): Promise<number> => {
		setSaveError(undefined)
		try {
			const content = record(string(), unknown()).parse(input)
			if (!draft && currentValue && equals(currentValue.value, content))
				return currentValue.id
			return await saveValue(toInput(content))
		} catch (error) {
			setSaveError(
				error instanceof Error
					? error.message
					: 'Save failed. Check save status.'
			)
			if (node.type === NodeType.Media) throw error
			return currentValue?.id ?? 0
		}
	}

	const EditorCmp = matcher(node, view)
	if (!$canEdit.value && !isList(node) && node.type !== NodeType.Article)
		return (
			<output className="text-muted-foreground whitespace-pre-wrap break-words">
				{displayedValue?.value?.name ??
					displayedValue?.value?.content ??
					JSON.stringify(displayedValue?.value ?? null)}
			</output>
		)
	return (
		EditorCmp && (
			<>
				<EditorCmp
					key={`${node.id}:${value?.[0]?.id ?? listPath.join('-')}`}
					node={node}
					value={isList(node) ? value : displayedValue}
					save={save}
					stage={stage}
					settings={settings}
				/>
				{saveError && (
					<span role="alert" className="text-destructive text-xs">
						{saveError}
					</span>
				)}
			</>
		)
	)
}
