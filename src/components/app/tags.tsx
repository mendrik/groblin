import { IconTag } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { IconButton } from '../utils/icon-button'

export const Tags = () => {
	return (
		<div className="flex flex-row gap-4 items-center">
			<Tabs defaultValue="default" className="w-fit">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="default">Default</TabsTrigger>
					<TabsTrigger value="staging">Staging</TabsTrigger>
					<TabsTrigger value="production">Production</TabsTrigger>
				</TabsList>
			</Tabs>
			<IconButton icon={IconTag} size="sm">
				Add Tag
			</IconButton>
		</div>
	)
}
