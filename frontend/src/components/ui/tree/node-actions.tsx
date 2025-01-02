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
	IconCopyPlus,
	IconCursorText,
	IconDots,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconTrash
} from '@tabler/icons-react'
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
				<IconDots
					className="w-4 h-4 shrink-0 text-muted-foreground"
					focusable={false}
					tabIndex={-1}
					stroke={1}
				/>
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
						<IconCopyPlus className="w-4 h-4" />
						<span>Add child…</span>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate(node, 'sibling-above')}
				>
					<IconRowInsertTop className="w-4 h-4" />
					<span>Insert above…</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate(node, 'sibling-below')}
				>
					<IconRowInsertBottom className="w-4 h-4" />
					<span>Insert below…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => startEditing(node.id)}
				>
					<IconCursorText className="w-4 h-4" />
					<span>Rename</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openNodeDelete(node)}
				>
					<IconTrash className="w-4 h-4" />
					<span>Delete…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openNodeProperties(node)}
				>
					<IconTrash className="w-4 h-4" />
					<span>Properties…</span>
				</DropdownMenuItem>
				<NodeExtraActions node={node} />
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
