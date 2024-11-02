import { $tag, $tags } from '@/state/tag'
import { IconTag } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { IconButton } from '../utils/icon-button'

export const Tags = () => {
	return (
		<div className="flex flex-row gap-1 items-center">
			<Tabs defaultValue={$tag.value} className="w-fit">
				<TabsList className="grid w-full auto-cols-auto h-8">
					{$tags.value.map(tag => (
						<TabsTrigger key={tag.id} value={`${tag.id}`} className="text-xs">
							<div className="truncate w-full overflow-hidden">{tag.name}</div>
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<IconButton icon={IconTag} size="sm" variant="secondary">
				new tag
			</IconButton>
		</div>
	)
}
