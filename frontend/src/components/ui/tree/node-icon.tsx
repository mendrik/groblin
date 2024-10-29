import { NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import {
	IconBox,
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
		caseOf([isType(NodeType.Object), _], (_, p) => <IconSitemap {...p} />),
		caseOf([isType(NodeType.Boolean), _], (_, p) => <IconToggleLeft {...p} />),
		caseOf([isType(NodeType.Date), _], (_, p) => <IconCalendar {...p} />),
		caseOf([isType(NodeType.List), _], (_, p) => <IconDatabase {...p} />),
		caseOf([isType(NodeType.Number), _], (_, p) => <IconNumber123 {...p} />),
		caseOf([isType(NodeType.String), _], (_, p) => <IconLetterCase {...p} />),
		caseOf([isType(NodeType.Schema), _], (_, p) => <IconBox {...p} />)
	)(node, props)
