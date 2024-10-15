import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import { pipeTap } from '@/lib/ramda'
import { updateSignal } from '@/lib/utils'
import {
	$lastFocusedNode,
	type TreeNode,
	focusOn,
	startEditing
} from '@/state/tree'
import {
	IconCursorText,
	IconDots,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconTrash
} from '@tabler/icons-react'
import { not } from 'ramda'
import type { RefObject } from 'react'
import { $deleteDialogOpen, NodeDelete } from './node-delete'

type OwnProps = {
	node: TreeNode
	editor: RefObject<HTMLInputElement>
}

export const NodeOptions = ({ node, editor }: OwnProps) => {
	return $lastFocusedNode.value === node.id ? (
		<>
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
					className="border-muted-foreground"
					onCloseAutoFocus={preventDefault}
					onKeyDown={stopPropagation}
				>
					<DropdownMenuItem className="flex gap-2 items-center">
						<IconRowInsertTop className="w-4 h-4" />
						<span>Insert above...</span>
					</DropdownMenuItem>
					<DropdownMenuItem className="flex gap-2 items-center">
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
			<NodeDelete />
		</>
	) : (
		<div className="w-4 h-6 shrink-0 ml-auto" />
	)
}
