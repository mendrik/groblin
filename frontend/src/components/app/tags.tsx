import type { Tag } from '@/gql/graphql'
import { cn, notNil, setSignal } from '@/lib/utils'
import { $tag, $tags } from '@/state/tag'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { IconTag } from '@tabler/icons-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
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
	return (
		<DropdownMenu>
			<SortableItem
				key={`${tag.id}`}
				id={tag.id}
				className="h-7 z-1"
				renderer={({ listeners }) => (
					<DropdownMenuTrigger
						className={cn(
							'h-7 whitespace-nowrap rounded-md',
							'ring-offset-background transition-all text-foreground shadow',
							'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
							'disabled:pointer-events-none bg-background'
						)}
						{...listeners}
					>
						<TagName tag={tag} />
					</DropdownMenuTrigger>
				)}
			/>
			<DropdownMenuContent className="w-56" sideOffset={6} align="start">
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

export const Tags = () => {
	if (!$tag.value) return null

	return (
		<div className="flex flex-row gap-1 items-center">
			<SortContext
				strategy={horizontalListSortingStrategy}
				values={$tags.value}
			>
				<Tabs
					value={`${notNil($tag).id}`}
					className="w-fit"
					onValueChange={selectTag}
				>
					<TabsList className="h-8 select-none" id="tags">
						{$tags.value.map(tag =>
							tag.id === notNil($tag).id ? (
								<ActiveTab tag={tag} key={tag.id} />
							) : (
								<SortableItem
									key={`${tag.id}`}
									id={tag.id}
									className="h-7"
									renderer={({ listeners }) => (
										<TabsTrigger
											key={tag.id}
											value={`${tag.id}`}
											className="p-0"
											{...listeners}
										>
											<TagName tag={tag} />
										</TabsTrigger>
									)}
								/>
							)
						)}
					</TabsList>
				</Tabs>
			</SortContext>
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
}
