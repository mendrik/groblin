import { cn, notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $activeItems, $valueMap, activateListItem } from '@/state/value'
import {
	IconSquareRoundedMinus as Minus,
	IconSquareRoundedPlus as Plus
} from '@tabler/icons-react'
import { Button } from '../button'
import { MicroIcon } from '../random/micro-icon'
import { openListItemCreate } from './list-item-create'
import { openListItemDelete } from './list-item-delete'

type OwnProps = {
	node: TreeNode
}

export const ListEditor = ({ node }: OwnProps) => {
	const items = notNil($valueMap)[node.id] ?? []
	const $activeItem = notNil($activeItems)[node.id]
	return (
		<div className="flex flex-row w-full gap-2 h-7 items-center">
			<ol className="flex flex-row gap-1 items-center -ml-1 divide-x">
				{items.map(item => (
					<li key={`${item.id}`}>
						<Button
							size="sm"
							variant="ghost"
							className={cn(
								'py-0 px-2 h-6 text-md font-normal',
								$activeItem?.id === item.id && 'ring-1 ring-muted-foreground'
							)}
							onClick={() => activateListItem(item)}
						>
							{item.value.name}
						</Button>
					</li>
				))}
			</ol>
			<div className="flex content-center">
				<MicroIcon icon={Plus} onClick={() => openListItemCreate(node)} />
				{$activeItem && (
					<MicroIcon icon={Minus} onClick={() => openListItemDelete(node)} />
				)}
			</div>
		</div>
	)
}
