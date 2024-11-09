import type { Tag } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
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

type ActiveTabProps = { tag: Tag }

const ActiveTab = ({ tag }: ActiveTabProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="inline-flex items-center justify-center h-7 whitespace-nowrap rounded-md px-3 py-1 font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-foreground shadow text-xs">
				<div className="truncate w-full overflow-hidden">{tag.name}</div>
			</DropdownMenuTrigger>
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
								<TabsTrigger
									id={`${tag.id}`}
									key={tag.id}
									value={`${tag.id}`}
									className="text-xs h-7"
								>
									<div className="truncate w-full overflow-hidden">
										{tag.name}
									</div>
								</TabsTrigger>
							)
						)}
					</TabsList>
				</Tabs>
			</SortContext>
			<IconButton
				icon={IconTag}
				size="sm"
				variant="secondary"
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
