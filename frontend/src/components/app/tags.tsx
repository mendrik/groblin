import type { Tag } from '@/gql/graphql'
import { cn, notNil, setSignal } from '@/lib/utils'
import { $tag, $tags, reorderTag } from '@/state/tag'
import type { DragEndEvent } from '@dnd-kit/core'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { IconTag } from '@tabler/icons-react'
import { useState } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem
} from '../ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { TagCreate, openTagCreate } from '../ui/tags/tag-create'
import { TagDelete, openTagDelete } from '../ui/tags/tag-delete'
import { TagEdit, openTagEdit } from '../ui/tags/tag-edit'
import { IconButton } from '../utils/icon-button'
import { SortContext } from '../utils/sort-context'
import { SortableItem } from '../utils/sortable-item'

type TabProps = { tag: Tag }

const ActiveTab = ({ tag }: TabProps) => {
	const [open, setOpen] = useState(false)
	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<SortableItem
				key={`${tag.id}`}
				id={tag.id}
				renderer={({ listeners }) => (
					<div
						key={`${tag.id}`}
						className={cn(
							'h-7 whitespace-nowrap rounded-md border border-red relative flex items-center justify-center',
							'ring-offset-background transition-all text-foreground shadow',
							'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
							'disabled:pointer-events-none bg-background'
						)}
						onClick={() => setOpen(!open)}
						{...listeners}
					>
						<DropdownMenuTrigger className="pointer-events-none opacity-0 w-full absolute inset-0" />
						<TagName tag={tag} />
					</div>
				)}
			/>
			<DropdownMenuContent
				className="w-56"
				sideOffset={4}
				alignOffset={-2}
				align="start"
			>
				<DropdownMenuItem onSelect={() => openTagEdit(tag)}>
					Settings
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => openTagDelete(tag)}>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

const selectTag = (tagIdStr: string) =>
	setSignal(
		$tag,
		$tags.value.find(t => `${t.id}` === tagIdStr)
	)

const TagName = ({ tag }: TabProps) => (
	<div className="truncate w-full overflow-hidden text-xs px-3">{tag.name}</div>
)

const reorderCommand = ({ active, over }: DragEndEvent) => {
	if (!over) return
	reorderTag({
		id: active.id as number,
		overId: over.id as number
	})
}

export const Tags = () => (
	<div className="flex flex-row gap-1 items-center">
		<Tabs
			value={`${notNil($tag).id}`}
			className="w-fit"
			onValueChange={selectTag}
		>
			<TabsList className="h-8 select-none" id="tags">
				<SortContext
					strategy={horizontalListSortingStrategy}
					onDragEnd={reorderCommand}
					values={$tags.value}
				>
					{$tags.value.map(tag =>
						tag.id === notNil($tag).id ? (
							<ActiveTab tag={tag} key={`${tag.id}`} />
						) : (
							<SortableItem
								key={`${tag.id}`}
								id={tag.id}
								className="h-7"
								renderer={({ listeners, setActivatorNodeRef }) => (
									<TabsTrigger
										key={`${tag.id}`}
										value={`${tag.id}`}
										className="p-0"
										ref={setActivatorNodeRef}
										{...listeners}
									>
										<TagName tag={tag} />
									</TabsTrigger>
								)}
							/>
						)
					)}
				</SortContext>
			</TabsList>
		</Tabs>
		<IconButton
			icon={IconTag}
			size="sm"
			variant="ghost"
			onClick={openTagCreate}
		>
			new tag
		</IconButton>
		<TagCreate />
		<TagEdit />
		<TagDelete />
	</div>
)
