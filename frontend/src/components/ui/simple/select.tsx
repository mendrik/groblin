import { type ReactNode, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../select'

type OwnProps<T> = {
	options: T[]
	render: (item: T) => ReactNode
	placeholder?: string
	optional?: boolean
	allowEmpty?: boolean
	value: T | undefined
	className?: string
	onChange: (value: T | undefined) => void
}

export const SimpleSelect = <T,>({
	options,
	optional = false,
	placeholder,
	onChange,
	value,
	className,
	render
}: OwnProps<T>) => {
	const [open, setOpen] = useState(false)
	const currentItem = value && render(value)

	return (
		<Select
			onOpenChange={setOpen}
			open={open}
			onValueChange={v => {
				onChange(v as T)
				setOpen(false)
			}}
		>
			<SelectTrigger className={className}>
				{currentItem ?? placeholder}
			</SelectTrigger>
			<SelectContent>
				{optional && (
					<SelectItem key="none" value={null}>
						{placeholder}
					</SelectItem>
				)}
				{options.map((value, idx) => (
					<SelectItem key={`${idx}-${render(value)}`} value={value}>
						{render(value)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
