import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import {
	IconCalendar,
	IconDatabase,
	IconLetterCase,
	IconNumber123,
	type IconProps,
	IconSitemap,
	IconToggleLeft
} from '@tabler/icons-react'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
import { NodeType } from './types'

type Icon = IconProps

type OwnProps = {
	node: TreeNode
} & Icon

const isType =
	(type: NodeType) =>
	(node: TreeNode): boolean =>
		node.type === type

export const NodeIcon = ({ node, ...props }: OwnProps) =>
	match<[TreeNode, Icon], ReactNode>(
		caseOf([isType(NodeType.object), _], (_, p) => <IconSitemap {...p} />),
		caseOf([isType(NodeType.boolean), _], (_, p) => <IconToggleLeft {...p} />),
		caseOf([isType(NodeType.date), _], (_, p) => <IconCalendar {...p} />),
		caseOf([isType(NodeType.list), _], (_, p) => <IconDatabase {...p} />),
		caseOf([isType(NodeType.number), _], (_, p) => <IconNumber123 {...p} />),
		caseOf([isType(NodeType.string), _], (_, p) => <IconLetterCase {...p} />)
	)(node, props)
