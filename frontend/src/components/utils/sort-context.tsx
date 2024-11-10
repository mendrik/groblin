import {} from '@/lib/utils'
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	type UniqueIdentifier,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import {
	restrictToHorizontalAxis,
	restrictToParentElement
} from '@dnd-kit/modifiers'
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

type Identifyable = {
	id: UniqueIdentifier
}

type Ownprops<T extends Identifyable> = PropsWithChildren<{
	strategy?: SortingStrategy
	values: T[]
}>

export const SortContext = <T extends Identifyable>({
	strategy,
	values,
	children
}: Ownprops<T>) => {
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 3 }
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	)

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
			collisionDetection={closestCenter}
			onDragEnd={console.dir}
		>
			<SortableContext items={values} strategy={strategy}>
				{children}
			</SortableContext>
		</DndContext>
	)
}
