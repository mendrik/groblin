import type { Value } from '@/gql/graphql'
import { cn, notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $activeListItems, activateListItem } from '@/state/value'
import {
	IconPoint,
	IconPointFilled,
	IconSquareRoundedMinus as Minus,
	IconSquareRoundedPlus as Plus
} from '@tabler/icons-react'
import { Button } from '../button'
import { MicroIcon } from '../random/micro-icon'
import { openListItemCreate } from './list-item-create'
import { openListItemDelete } from './list-item-delete'

type ListValue = Value & {
	value: {
		name: string
	}
}

type OwnProps = {
	node: TreeNode
	value?: ListValue[]
}

export const TabEditor = ({ node, value: items = [] }: OwnProps) => {
	const $activeItem = notNil($activeListItems)[node.id]

	return (
		<div className="flex flex-row w-full gap-2 h-7 items-center">
			<ol className="flex flex-row gap-1 items-center -ml-1">
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
export const PagedEditor = ({ node, value: items = [] }: OwnProps) => {
	const $activeItem = notNil($activeListItems)[node.id]

	return (
		<ol className="flex flex-row items-center -ml-1">
			{items.slice(0, 20).map(item => (
				<li key={`${item.id}`} className="h-5">
					{$activeItem?.id === item.id ? (
						<MicroIcon icon={IconPointFilled} />
					) : (
						<MicroIcon
							icon={IconPoint}
							onClick={() => activateListItem(item)}
						/>
					)}
				</li>
			))}
		</ol>
	)
}

export const ListEditor = ({ node, value = [] }: OwnProps) => {
	return value.length <= 5 ? (
		<TabEditor node={node} value={value} />
	) : (
		<PagedEditor node={node} value={value} />
	)
}
