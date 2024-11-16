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

export const NodeIcon = ({ node, ...props }: OwnProps) =>
	match<[TreeNode, Icon], ReactNode>(
		caseOf([{ type: NodeType.Object }, _], (_, p) => <IconSitemap {...p} />),
		caseOf([{ type: NodeType.Boolean }, _], (_, p) => (
			<IconToggleLeft {...p} />
		)),
		caseOf([{ type: NodeType.Date }, _], (_, p) => <IconCalendar {...p} />),
		caseOf([{ type: NodeType.List }, _], (_, p) => <IconDatabase {...p} />),
		caseOf([{ type: NodeType.Number }, _], (_, p) => <IconNumber123 {...p} />),
		caseOf([{ type: NodeType.String }, _], (_, p) => <IconLetterCase {...p} />),
		caseOf([{ type: NodeType.Schema }, _], (_, p) => <IconBox {...p} />)
	)(node, props)
