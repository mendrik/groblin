import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { ListItemValue } from '@/components/ui/values/list-editor'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import {
	IconClipboardCopy,
	IconCursorText,
	IconDotsVertical,
	IconTarget,
	IconTrash
} from '@tabler/icons-react'

type OwnProps = {
	node: TreeNode
	id: number
	value: ListItemValue
}

export const ListItemActions = ({ id, node, value }: OwnProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="no-focus" onKeyDown={stopPropagation}>
				<IconDotsVertical
					className="w-4 h-4 shrink-0 text-muted-foreground"
					focusable={false}
					tabIndex={-1}
					stroke={0.5}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				onFocus={stopPropagation}
				onCloseAutoFocus={preventDefault}
				onKeyDown={stopPropagation}
			>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconTrash className="w-4 h-4" />
					<span>Delete</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconCursorText className="w-4 h-4" />
					<span>Rename</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconTarget className="w-4 h-4" />
					<span>Focus</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconClipboardCopy className="w-4 h-4" />
					<span>Copy</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
