import { Import, Trash } from 'lucide-react'
import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { truncateList as openNodeTruncate } from '@/state/value'
import { DropdownMenuItem } from '../dropdown-menu'
import { openImportJson } from '../io/import-array-dialog'
import { openImportJson as openObjectImport } from '../io/import-object-dialog'
import { Icon } from '../simple/icon'

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
		onSelect={() => openObjectImport(node)}
	>
		<Icon icon={Import} />
		<span>Import...</span>
	</DropdownMenuItem>
)

export const NodeExtraActions = ({ node }: OwnProps) => {
	if (node.type === NodeType.List) return <ImportArray node={node} />
	if (node.type === NodeType.Object || node.type === NodeType.Root)
		return <ImportObject node={node} />
	return null
}
