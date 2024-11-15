import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { focusOn, preventDefault, stopPropagation } from '@/lib/dom-events'
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
import type { RefObject } from 'react'
import { openNodeCreate } from './node-create'
import { openNodeDelete } from './node-delete'
import { openNodeSettings } from './node-properties'
import { canHaveChildren } from './utils'

type OwnProps = {
	node: TreeNode
	editor: RefObject<HTMLInputElement>
}

export const NodeActions = ({ node, editor }: OwnProps) => {
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
						<span>Add child…</span>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate('sibling-above')}
				>
					<IconRowInsertTop className="w-4 h-4" />
					<span>Insert above…</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onClick={() => openNodeCreate('sibling-below')}
				>
					<IconRowInsertBottom className="w-4 h-4" />
					<span>Insert below…</span>
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
					onSelect={openNodeDelete}
				>
					<IconTrash className="w-4 h-4" />
					<span>Delete…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={openNodeSettings}
				>
					<IconTrash className="w-4 h-4" />
					<span>Properties…</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	) : (
		<div className="w-4 h-6 shrink-0 ml-auto" />
	)
}
