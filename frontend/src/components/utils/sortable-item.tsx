import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PropsWithChildren } from 'react'
type OwnProps = PropsWithChildren<{
	id: string | number
}>

export const SortableItem = ({ children, id }: OwnProps) => {
	const { attributes, listeners, transform, transition, setNodeRef } =
		useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition
	}

	return (
		<div style={style} {...attributes} {...listeners} ref={setNodeRef}>
			{children}
		</div>
	)
}
