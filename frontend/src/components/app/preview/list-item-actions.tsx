import { Crosshair, EllipsisVertical, Trash } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/simple/icon'
import type { ListItemValue } from '@/components/ui/values/list-editor'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import { $canEdit } from '@/state/access'
import type { TreeNode } from '@/state/tree'
import {
	activateListItem,
	deleteListItem as openListItemDelete
} from '@/state/value'

type OwnProps = {
	node: TreeNode
	id: number
	value: ListItemValue
}

export const ListItemActions = ({ value }: OwnProps) => {
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
				{$canEdit.value && (
					<DropdownMenuItem
						className="flex gap-2 items-center"
						onSelect={() => openListItemDelete(value)}
					>
						<Icon icon={Trash} />
						<span>Delete...</span>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
