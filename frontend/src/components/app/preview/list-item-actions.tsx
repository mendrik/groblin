import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { ListItemValue } from '@/components/ui/values/list-editor'
import { openListItemDelete } from '@/components/ui/values/list-item-delete'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import { activateListItem } from '@/state/value'
import {
	IconClipboardCopy,
	IconDotsVertical,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconTrash,
	IconViewfinder
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
					stroke={1}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				onFocus={stopPropagation}
				onCloseAutoFocus={preventDefault}
				onKeyDown={stopPropagation}
			>
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => activateListItem(value)}
				>
					<IconViewfinder className="w-4 h-4" />
					<span>Focus</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconClipboardCopy className="w-4 h-4" />
					<span>Copy</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconRowInsertTop className="w-4 h-4" />
					<span>Insert above…</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<IconRowInsertBottom className="w-4 h-4" />
					<span>Insert below…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openListItemDelete(value)}
				>
					<IconTrash className="w-4 h-4" />
					<span>Delete...</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
