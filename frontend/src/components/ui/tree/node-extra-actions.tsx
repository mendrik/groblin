import { type NodeSettings, NodeType } from '@/gql/graphql'
import { $nodeSettingsMap } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { IconPackageImport, IconTrash } from '@tabler/icons-react'
import { T as _, isEmpty } from 'ramda'
import type { ReactNode } from 'react'
import { DropdownMenuItem } from '../dropdown-menu'
import { openImportJson } from '../io/import-array-dialog'
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
			<IconPackageImport className="w-4 h-4" />
			<span>Import...</span>
		</DropdownMenuItem>
		<DropdownMenuItem
			className="flex gap-2 items-center"
			onSelect={() => openNodeTruncate(node)}
		>
			<IconTrash className="w-4 h-4" />
			<span>Truncate...</span>
		</DropdownMenuItem>
	</>
)

const ImportObject = ({ node }: OwnProps) => (
	<DropdownMenuItem
		className="flex gap-2 items-center"
		onSelect={() => openImportJson(node)}
	>
		<IconPackageImport className="w-4 h-4" />
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
		caseOf(
			[{ type: NodeType.List }, { scoped: true }],
			<ImportArray node={node} />
		),
		caseOf([_, _], null)
	)(node, settings?.settings ?? {})
}
