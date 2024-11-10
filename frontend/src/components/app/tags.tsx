import type { Tag } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { cn, notNil, setSignal } from '@/lib/utils'
import { $tag, $tags } from '@/state/tag'
import { horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { IconGripVertical, IconTag } from '@tabler/icons-react'
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

type ActiveTabProps = { tag: Tag }

const ActiveTab = ({ tag }: ActiveTabProps) => {
	return (
		<DropdownMenu>
			<SortableItem
				key={`${tag.id}`}
				id={tag.id}
				className="h-7 z-10"
				renderer={({ listeners, setActivatorNodeRef }) => (
					<DropdownMenuTrigger
						className={cn(
							'inline-flex items-center justify-center h-7 whitespace-nowrap rounded-md p-1',
							'ring-offset-background transition-all gap-1 text-foreground shadow',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
							'disabled:pointer-events-none bg-background'
						)}
					>
						<div
							ref={setActivatorNodeRef}
							{...listeners}
							onPointerDownCapture={stopPropagation}
						>
							<IconGripVertical
								className="w-4 h-4 text-muted-foreground"
								stroke={1}
							/>
						</div>
						<div className="truncate w-full overflow-hidden text-xs pr-2">
							{tag.name}
						</div>
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
									renderer={() => (
										<TabsTrigger key={tag.id} value={`${tag.id}`}>
											<div className="truncate w-full overflow-hidden text-xs">
												{tag.name}
											</div>
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
