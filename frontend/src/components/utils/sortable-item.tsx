import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { HTMLAttributes, ReactNode } from 'react'

type OwnProps = {
	id: string | number
	renderer: (props: ReturnType<typeof useSortable>) => ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'id'>

export const SortableItem = ({ renderer, id, ...props }: OwnProps) => {
	const sortable = useSortable({ id })
	const { attributes, transform, transition, setNodeRef, listeners } = sortable
	const style = {
		transform: CSS.Translate.toString(transform),
		transition
	}
	return (
		<div
			style={style}
			ref={setNodeRef}
			{...attributes}
			{...props}
			{...listeners}
		>
			{renderer(sortable)}
		</div>
	)
}
