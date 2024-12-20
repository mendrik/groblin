import type { Value } from '@/gql/graphql'
import { preventDefault, stopPropagation } from '@/lib/dom-events'
import { cn, notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $activeListItems, activateListItem } from '@/state/value'
import {
	IconChevronLeft,
	IconChevronLeftPipe,
	IconChevronRight,
	IconChevronRightPipe,
	IconChevronsLeft,
	IconChevronsRight,
	IconCursorText,
	IconDotsVertical,
	IconTrash,
	IconSquareRoundedPlus as Plus
} from '@tabler/icons-react'
import { clamp, findIndex, isNotNil } from 'ramda'
import { useEffect } from 'react'
import { useEffectOnce } from 'react-use'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../dropdown-menu'
import { MicroIcon } from '../random/micro-icon'
import { openListItemCreate } from './list-item-create'
import { openListItemDelete } from './list-item-delete'
import { openListItemEdit } from './list-item-edit'

export type ListItemValue = Value & {
	value: {
		name: string
	}
}

type OwnProps = {
	node: TreeNode
	value?: ListItemValue[]
}

type ListItemActionsProps = {
	node: TreeNode
	item: ListItemValue
}

const ListItemActions = ({ node, item }: ListItemActionsProps) => (
	<DropdownMenu>
		<DropdownMenuTrigger className="h-7" onKeyDown={stopPropagation}>
			<IconDotsVertical className="w-4 h-4" />
		</DropdownMenuTrigger>
		<DropdownMenuContent
			onFocus={stopPropagation}
			onCloseAutoFocus={preventDefault}
			onKeyDown={stopPropagation}
		>
			<DropdownMenuItem
				className="flex gap-2 items-center"
				onClick={() => openListItemEdit(item)}
			>
				<IconCursorText className="w-4 h-4" />
				<span>Rename...</span>
			</DropdownMenuItem>
			<DropdownMenuItem
				className="flex gap-2 items-center"
				onClick={() => openListItemDelete(node)}
			>
				<IconTrash className="w-4 h-4" />
				<span>Delete...</span>
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
)

export const TabEditor = ({ node, value: items = [] }: OwnProps) => {
	const $activeItem = notNil($activeListItems)[node.id]
	const itemInList =
		isNotNil($activeItem) && items.some(i => i.id === $activeItem.id)

	useEffect(() => {
		if (items.length > 0 && !itemInList) {
			activateListItem(items[0])
		}
	}, [items, itemInList])

	return (
		<div
			className={cn(
				'flex flex-row gap-2 h-7 items-center relative',
				items.length && 'shadow-tabs'
			)}
		>
			<ol
				className={cn(
					'flex flex-row gap-1 ml-1 items-end',
					!items.length && 'hidden'
				)}
			>
				{items.map(item => (
					<li
						key={`${item.id}`}
						className={cn(
							'transform duration-100 flex flex-row items-center h-7 border border-border border-b-0 rounded-md',
							'rounded-b-none text-muted-foreground pr-1',
							$activeItem?.id === item.id &&
								'border-muted-foreground bg-black text-foreground',
							$activeItem?.id !== item.id &&
								'translate-y-[-1px] translate-z-[-1px] h-6 bg-background'
						)}
					>
						<button
							type="button"
							className="py-0 pl-3 pr-1 text-md whitespace-nowrap"
							onClick={() => activateListItem(item)}
						>
							{item.value.name}
						</button>
						{$activeItem?.id === item.id && (
							<ListItemActions node={node} item={item} />
						)}
					</li>
				))}
			</ol>
			<div className="flex content-center">
				<MicroIcon icon={Plus} onClick={() => openListItemCreate(node)} />
			</div>
		</div>
	)
}

export const PagedEditor = ({ node, value: items = [] }: OwnProps) => {
	const step = (items.length / 10) | 0
	const $activeItem = notNil($activeListItems)[node.id]
	const page = findIndex(item => item.id === $activeItem?.id, items)

	const activate = (offset: number) => {
		activateListItem(
			items[clamp(0, items.length - 1, page === -1 ? 0 : page + offset)]
		)
	}

	useEffectOnce(() => activate(0))

	return (
		<ol className="flex flex-row items-center h-5 mt-1 -ml-2 px-2 divider-x-1 divider-border">
			<li>
				<MicroIcon
					icon={IconChevronLeftPipe}
					stroke={2}
					onClick={() => activate(Number.MIN_SAFE_INTEGER)}
				/>
			</li>
			<li>
				<MicroIcon
					icon={IconChevronsLeft}
					stroke={2}
					onClick={() => activate(-step)}
				/>
			</li>
			<li>
				<MicroIcon
					icon={IconChevronLeft}
					stroke={2}
					onClick={() => activate(-1)}
				/>
			</li>
			<li>
				<MicroIcon
					icon={IconChevronRight}
					stroke={2}
					onClick={() => activate(1)}
				/>
			</li>
			<li>
				<MicroIcon
					icon={IconChevronsRight}
					stroke={2}
					onClick={() => activate(step)}
				/>
			</li>
			<li>
				<MicroIcon
					icon={IconChevronRightPipe}
					stroke={2}
					onClick={() => activate(Number.MAX_SAFE_INTEGER)}
				/>
			</li>
			<li className="mx-2 text-muted-foreground">
				<span className="text-foreground">{page + 1}</span> of {items.length}
			</li>
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
