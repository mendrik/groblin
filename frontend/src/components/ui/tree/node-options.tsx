import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { focusOn, preventDefault, stopPropagation } from '@/lib/dom-events'
import { updateSignal } from '@/lib/utils'
import { $focusedNode, type TreeNode, startEditing } from '@/state/tree'
import { pipeTap } from '@shared/utils/ramda'
import {
	IconCopyPlus,
	IconCursorText,
	IconDots,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconTrash
} from '@tabler/icons-react'
import { not } from 'ramda'
import type { RefObject } from 'react'
import { openNodeCreate } from './node-create'
import { $deleteDialogOpen } from './node-delete'
import { canHaveChildren } from './utils'

type OwnProps = {
	node: TreeNode
	editor: RefObject<HTMLInputElement>
}

export const NodeOptions = ({ node, editor }: OwnProps) => {
	return $focusedNode.value === node.id ? (
		<DropdownMenu>
			<DropdownMenuTrigger className="no-focus" onKeyDown={stopPropagation}>
				<IconDots
					className="w-4 h-4 shrink-0 text-muted-foreground"
					focusable={false}
					tabIndex={-1}
					stroke={0.5}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				onCloseAutoFocus={preventDefault}
				onKeyDown={stopPropagation}
			>
				{canHaveChildren(node) && (
					<DropdownMenuItem
						className="flex gap-2 items-center"
						onClick={() => openNodeCreate('child')}
					>
						<IconCopyPlus className="w-4 h-4" />
						<span>Add child...</span>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate('sibling-above')}
				>
					<IconRowInsertTop className="w-4 h-4" />
					<span>Insert above...</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate('sibling-below')}
				>
					<IconRowInsertBottom className="w-4 h-4" />
					<span>Insert below...</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={pipeTap(startEditing, focusOn(editor))}
				>
					<IconCursorText className="w-4 h-4" />
					<span>Rename</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => updateSignal($deleteDialogOpen)(not)}
				>
					<IconTrash className="w-4 h-4" />
					<span>Delete...</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	) : (
		<div className="w-4 h-6 shrink-0 ml-auto" />
	)
}
