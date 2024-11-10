import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { HTMLAttributes, ReactNode } from 'react'

type PassOn = ReturnType<typeof useSortable>

type OwnProps = {
	id: string | number
	renderer: (
		props: Omit<
			PassOn,
			'setNodeRef' | 'transform' | 'transition' | 'attributes'
		>
	) => ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'id'>

export const SortableItem = ({ renderer, id, ...props }: OwnProps) => {
	const { attributes, transform, transition, setNodeRef, ...rest } =
		useSortable({ id })

	const style = {
		transform: CSS.Translate.toString(transform),
		transition
	}

	return (
		<div style={style} {...attributes} ref={setNodeRef} {...props}>
			{renderer(rest)}
		</div>
	)
}
