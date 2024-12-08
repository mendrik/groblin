import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import {
	IconCalendarClock,
	IconCalendarMonth,
	IconDatabase,
	IconHelpHexagon,
	IconLetterCase,
	IconMapPin,
	IconMarkdown,
	IconNumber123,
	IconPalette,
	IconPaperclip,
	type IconProps,
	IconSelect,
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
		caseOf([{ type: NodeType.Date }, _], (_, p) => (
			<IconCalendarMonth {...p} />
		)),
		caseOf([{ type: NodeType.List }, _], (_, p) => <IconDatabase {...p} />),
		caseOf([{ type: NodeType.Number }, _], (_, p) => <IconNumber123 {...p} />),
		caseOf([{ type: NodeType.String }, _], (_, p) => <IconLetterCase {...p} />),
		caseOf([{ type: NodeType.Color }, _], (_, p) => <IconPalette {...p} />),
		caseOf([{ type: NodeType.Location }, _], (_, p) => <IconMapPin {...p} />),
		caseOf([{ type: NodeType.Media }, _], (_, p) => <IconPaperclip {...p} />),
		caseOf([{ type: NodeType.Article }, _], (_, p) => <IconMarkdown {...p} />),
		caseOf([{ type: NodeType.Enum }, _], (_, p) => <IconSelect {...p} />),
		caseOf([{ type: NodeType.Event }, _], (_, p) => (
			<IconCalendarClock {...p} />
		)),
		caseOf([_, _], (_, p) => <IconHelpHexagon {...p} />)
	)(node, props)
