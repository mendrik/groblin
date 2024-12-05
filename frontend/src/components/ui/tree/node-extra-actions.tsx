import { type NodeSettings, NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import { $nodeSettingsMap } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { IconPackageImport } from '@tabler/icons-react'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
import { DropdownMenuItem } from '../dropdown-menu'
import { openImportJson } from '../io/import-dialog'

type OwnProps = {
	node: TreeNode
}

const ImportJson = ({ node }: OwnProps) => (
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
		caseOf([{ type: NodeType.Object }, _], () => <ImportJson node={node} />),
		caseOf([{ type: NodeType.List }, { excessive: true }], () => (
			<ImportJson node={node} />
		)),
		caseOf([_, _], () => null)
	)(node, settings?.settings ?? {})
}
