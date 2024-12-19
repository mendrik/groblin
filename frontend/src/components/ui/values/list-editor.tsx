import type { Value } from '@/gql/graphql'
import { cn, notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $activeListItems, activateListItem } from '@/state/value'
import {
	IconArrowNarrowLeft,
	IconArrowNarrowRight,
	IconDotsVertical,
	IconSquareRoundedMinus as Minus,
	IconSquareRoundedPlus as Plus
} from '@tabler/icons-react'
import { findIndex } from 'ramda'
import { isObject } from 'ramda-adjunct'
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
	const active = isObject($activeItem)

	return (
		<div
			className={cn(
				'flex flex-row w-full gap-2 h-7 items-center relative',
				active && 'shadow-tabs'
			)}
		>
			<ol className="flex flex-row gap-1 items-end">
				{items.map(item => (
					<li
						key={`${item.id}`}
						className={cn(
							'flex flex-row items-center gap-1 h-7 border border-border border-b-0 rounded-md',
							'rounded-b-none px-1 text-muted-foreground',
							$activeItem?.id === item.id &&
								'border-muted-foreground bg-background hover:bg-background text-foreground',
							active &&
								$activeItem?.id !== item.id &&
								'translate-y-[-1px] translate-z-[-1px] h-6'
						)}
					>
						<button
							type="button"
							className="py-0 pl-2 text-md"
							onClick={() => activateListItem(item)}
						>
							{item.value.name}
						</button>
						<MicroIcon icon={IconDotsVertical} />
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
	const page = findIndex(item => item.id === $activeItem?.id, items) + 1

	return (
		<ol className="flex flex-row items-center -ml-1">
			<li>
				{page} of {items.length}
			</li>
			<li className="h-5">
				<MicroIcon icon={IconArrowNarrowLeft} />
			</li>
			<li className="h-5">
				<MicroIcon icon={IconArrowNarrowRight} />
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
