import { $tag } from '@/state/tag'
import { IconTag } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { IconButton } from '../utils/icon-button'

export const Tags = () => {
	return (
		<div className="flex flex-row gap-1 items-center">
			<Tabs defaultValue={$tag.value} className="w-fit">
				<TabsList className="grid w-full grid-cols-3 h-8">
					<TabsTrigger value="default" className="text-xs">
						<div className="truncate w-full overflow-hidden">Default</div>
					</TabsTrigger>
					<TabsTrigger value="staging" className="text-xs">
						<div className="truncate w-full overflow-hidden">Staging</div>
					</TabsTrigger>
					<TabsTrigger value="production" className="text-xs">
						<div className="truncate w-full overflow-hidden">Production</div>
					</TabsTrigger>
				</TabsList>
			</Tabs>
			<IconButton icon={IconTag} size="sm" variant="secondary">
				new tag
			</IconButton>
		</div>
	)
}
