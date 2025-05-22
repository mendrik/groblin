import { type NodeSettings, NodeType } from '@/gql/graphql'
import { $nodeSettingsMap } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from 'matchblade'

import { Import, Trash } from 'lucide-react'
import { T as _, isEmpty } from 'ramda'
import type { ReactNode } from 'react'
import { DropdownMenuItem } from '../dropdown-menu'
import { openImportJson } from '../io/import-array-dialog'
import { Icon } from '../simple/icon'
import { openNodeTruncate } from './node-truncate'

type OwnProps = {
	node: TreeNode
}

const ImportArray = ({ node }: OwnProps) => (
	<>
		<DropdownMenuItem
			className="flex gap-2 items-center"
			onSelect={() => openImportJson(node)}
		>
			<Icon icon={Import} />
			<span>Import...</span>
		</DropdownMenuItem>
		<DropdownMenuItem
			className="flex gap-2 items-center"
			onSelect={() => openNodeTruncate(node)}
		>
			<Icon icon={Trash} />
			<span>Truncate...</span>
		</DropdownMenuItem>
	</>
)

const ImportObject = ({ node }: OwnProps) => (
	<DropdownMenuItem
		className="flex gap-2 items-center"
		onSelect={() => openImportJson(node)}
	>
		<Icon icon={Import} />
		<span>Import...</span>
	</DropdownMenuItem>
)

export const NodeExtraActions = ({ node }: OwnProps) => {
	const settings = $nodeSettingsMap.value[node.id] as NodeSettings | undefined
	return match<[TreeNode, Record<string, any>], ReactNode>(
		caseOf(
			[{ type: NodeType.Object, nodes: isEmpty }, _],
			<ImportObject node={node} />
		),
		caseOf([{ type: NodeType.List }, _], <ImportArray node={node} />),
		caseOf([_, _], null)
	)(node, settings?.settings ?? {})
}
