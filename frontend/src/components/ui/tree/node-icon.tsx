import { NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import {
	IconCalendarClock,
	IconCalendarMonth,
	IconClock,
	IconDatabase,
	IconHelpHexagon,
	IconLetterCase,
	IconMail,
	IconMapPin,
	IconNumber123,
	IconPalette,
	IconPaperclip,
	IconPhoneCall,
	type IconProps,
	IconSitemap,
	IconToggleLeft,
	IconWorldWww
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
		caseOf([{ type: NodeType.Email }, _], (_, p) => <IconMail {...p} />),
		caseOf([{ type: NodeType.Media }, _], (_, p) => <IconPaperclip {...p} />),
		caseOf([{ type: NodeType.Phone }, _], (_, p) => <IconPhoneCall {...p} />),
		caseOf([{ type: NodeType.Time }, _], (_, p) => <IconClock {...p} />),
		caseOf([{ type: NodeType.Url }, _], (_, p) => <IconWorldWww {...p} />),
		caseOf([{ type: NodeType.Event }, _], (_, p) => (
			<IconCalendarClock {...p} />
		)),
		caseOf([_, _], (_, p) => <IconHelpHexagon {...p} />)
	)(node, props)
