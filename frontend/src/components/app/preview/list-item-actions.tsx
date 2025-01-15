import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/simple/icon'
import type { ListItemValue } from '@/components/ui/values/list-editor'
import { openListItemDelete } from '@/components/ui/values/list-item-delete'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import type { TreeNode } from '@/state/tree'
import { activateListItem } from '@/state/value'
import {
	BetweenHorizonalStart,
	Copy,
	Crosshair,
	EllipsisVertical,
	Trash
} from 'lucide-react'

type OwnProps = {
	node: TreeNode
	id: number
	value: ListItemValue
}

export const ListItemActions = ({ id, node, value }: OwnProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="no-focus" onKeyDown={stopPropagation}>
				<Icon icon={EllipsisVertical} />
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
					<Icon icon={Crosshair} />
					<span>Focus</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<Icon icon={Copy} />
					<span>Copy</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="flex gap-2 items-center">
					<Icon icon={BetweenHorizonalStart} />
					<span>Insert above…</span>
				</DropdownMenuItem>
				<DropdownMenuItem className="flex gap-2 items-center">
					<Icon icon={BetweenHorizonalStart} />
					<span>Insert below…</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex gap-2 items-center"
					onSelect={() => openListItemDelete(value)}
				>
					<Icon icon={Trash} />
					<span>Delete...</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
