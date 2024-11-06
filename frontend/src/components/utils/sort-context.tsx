import {} from '@/lib/utils'
import { $tags } from '@/state/tag'
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
	SortableContext,
	type SortingStrategy,
	sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import type { PropsWithChildren } from 'react'
import {} from '../ui/dropdown-menu'
import {} from '../ui/tabs'
import {} from '../ui/tags/tag-create'
import {} from '../ui/tags/tag-delete'
import {} from '../ui/tags/tag-edit'

type Ownprops = PropsWithChildren<{
	strategy?: SortingStrategy
}>

export const SortContext = ({ strategy, children }: Ownprops) => {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	)

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToHorizontalAxis]}
			collisionDetection={closestCenter}
			onDragEnd={console.dir}
		>
			<SortableContext items={$tags.value} strategy={strategy}>
				{children}
			</SortableContext>
		</DndContext>
	)
}
