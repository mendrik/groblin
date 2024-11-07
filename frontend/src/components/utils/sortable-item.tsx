import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { HTMLAttributes, PropsWithChildren } from 'react'
type OwnProps = PropsWithChildren<
	{
		id: string | number
	} & Omit<HTMLAttributes<HTMLDivElement>, 'id'>
>
export const SortableItem = ({ children, id, ...props }: OwnProps) => {
	const { attributes, listeners, transform, transition, setNodeRef } =
		useSortable({ id })

	const style = {
		transform: CSS.Translate.toString(transform),
		transition
	}

	return (
		<div
			style={style}
			{...attributes}
			{...listeners}
			ref={setNodeRef}
			{...props}
		>
			{children}
		</div>
	)
}
