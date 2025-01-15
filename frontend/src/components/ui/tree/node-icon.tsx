import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import type { Icon } from '@/type-patches/icons'
import { caseOf, match } from '@shared/utils/match'
import {
	CalendarDays,
	Database,
	FolderTree,
	HelpCircle,
	LetterText,
	ListTodo,
	NotepadText,
	Palette,
	Paperclip,
	Pi,
	ToggleLeft
} from 'lucide-react'
import { T as _ } from 'ramda'

type OwnProps = {
	node: TreeNode
}

export const nodeIcon: (node: TreeNode) => Icon = match<[TreeNode], Icon>(
	caseOf([{ type: NodeType.Object }], () => FolderTree),
	caseOf([{ type: NodeType.Boolean }], () => ToggleLeft),
	caseOf([{ type: NodeType.Date }], () => CalendarDays),
	caseOf([{ type: NodeType.List }], () => Database),
	caseOf([{ type: NodeType.Number }], () => Pi),
	caseOf([{ type: NodeType.String }], () => LetterText),
	caseOf([{ type: NodeType.Color }], () => Palette),
	caseOf([{ type: NodeType.Media }], () => Paperclip),
	caseOf([{ type: NodeType.Article }], () => NotepadText),
	caseOf([{ type: NodeType.Choice }], () => ListTodo),
	caseOf([_], () => HelpCircle)
)
