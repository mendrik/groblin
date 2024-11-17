import {} from '@/lib/utils'
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	type UniqueIdentifier,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core'
import {
	restrictToHorizontalAxis,
	restrictToParentElement
} from '@dnd-kit/modifiers'
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable'
import type { PropsWithChildren } from 'react'

type Identifyable = {
	id: UniqueIdentifier
}

type Ownprops<T extends Identifyable> = PropsWithChildren<{
	strategy?: SortingStrategy
	onDragEnd: (event: DragEndEvent) => void
	values: T[]
}>

export const SortContext = <T extends Identifyable>({
	strategy,
	values,
	onDragEnd,
	children
}: Ownprops<T>) => {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 3 }
		})
	)

	return (
		<DndContext
			sensors={sensors}
			modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
			collisionDetection={closestCenter}
			onDragEnd={onDragEnd}
		>
			<SortableContext items={values} strategy={strategy}>
				{children}
			</SortableContext>
		</DndContext>
	)
}
