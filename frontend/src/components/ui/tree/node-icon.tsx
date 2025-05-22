import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import type { Icon } from '@/type-patches/icons'
import {
	ALargeSmall,
	Box,
	CalendarDays,
	HelpCircle,
	ListTodo,
	NotepadText,
	Palette,
	Paperclip,
	Pi,
	Scroll,
	ToggleLeft
} from 'lucide-react'
import { caseOf, match } from 'matchblade'
import { T as _ } from 'ramda'

export const nodeIcon: (node: TreeNode) => Icon = match<[TreeNode], Icon>(
	caseOf([{ type: NodeType.Object }], () => Box),
	caseOf([{ type: NodeType.Boolean }], () => ToggleLeft),
	caseOf([{ type: NodeType.Date }], () => CalendarDays),
	caseOf([{ type: NodeType.List }], () => Scroll),
	caseOf([{ type: NodeType.Number }], () => Pi),
	caseOf([{ type: NodeType.String }], () => ALargeSmall),
	caseOf([{ type: NodeType.Color }], () => Palette),
	caseOf([{ type: NodeType.Media }], () => Paperclip),
	caseOf([{ type: NodeType.Article }], () => NotepadText),
	caseOf([{ type: NodeType.Choice }], () => ListTodo),
	caseOf([_], () => HelpCircle)
)
