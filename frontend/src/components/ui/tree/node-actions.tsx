import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import { type TreeNode, startEditing } from '@/state/tree'
import {
	CirclePlus,
	CornerDownRight,
	CornerUpRight,
	Ellipsis,
	Settings2,
	TextCursor,
	Trash
} from 'lucide-react'
import { Icon } from '../simple/icon'
import { openNodeCreate } from './node-create'
import { openNodeDelete } from './node-delete'
import { NodeExtraActions } from './node-extra-actions'
import { openNodeProperties } from './node-properties'
import { canHaveChildren } from './utils'

type OwnProps = {
	node: TreeNode
}

export const NodeActions = ({ node }: OwnProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="no-focus" onKeyDown={stopPropagation}>
				<Icon icon={Ellipsis} />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				onFocus={stopPropagation}
				onCloseAutoFocus={preventDefault}
				onKeyDown={stopPropagation}
			>
				{canHaveChildren(node) && (
					<DropdownMenuItem
						className="flex gap-2 items-center"
						onClick={() => openNodeCreate(node, 'child')}
					>
						<Icon icon={CirclePlus} />
						<span>Add child…</span>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate(node, 'sibling-above')}
				>
					<Icon icon={CornerUpRight} />
					<span>Insert above…</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate(node, 'sibling-below')}
				>
					<Icon icon={CornerDownRight} />
					<span>Insert below…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => startEditing(node.id)}
				>
					<Icon icon={TextCursor} />
					<span>Rename</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openNodeDelete(node)}
				>
					<Icon icon={Trash} />
					<span>Delete…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openNodeProperties(node)}
				>
					<Icon icon={Settings2} />
					<span>Properties…</span>
				</DropdownMenuItem>
				<NodeExtraActions node={node} />
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
