import type { FocusEventHandler, ReactNode } from 'react'
import { FormControl } from '../form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../select'

type OwnProps<T> = {
	options: T[]
	getKey: (item: T) => string | number
	render: (item: T) => ReactNode
	placeholder?: string
	optional?: boolean
	allowEmpty?: boolean
	value: T | undefined
	className?: string
	onChange: (value: T | undefined) => void
	formControl?: boolean
	name?: string
	disabled?: boolean
	onBlur?: FocusEventHandler<HTMLButtonElement>
}
const emptyKey = '__groblin_empty_option__'
export const SimpleSelect = <T,>({
	options,
	getKey,
	optional = false,
	placeholder,
	onChange,
	value,
	className,
	render,
	formControl = false,
	name,
	disabled,
	onBlur
}: OwnProps<T>) => {
	const selected = value === undefined ? '' : String(getKey(value))
	const trigger = (
		<SelectTrigger className={className} disabled={disabled} onBlur={onBlur}>
			{value === undefined ? placeholder : render(value)}
		</SelectTrigger>
	)
	return (
		<Select
			name={name}
			disabled={disabled}
			value={selected}
			onValueChange={key =>
				onChange(
					key === emptyKey
						? undefined
						: options.find(item => String(getKey(item)) === key)
				)
			}
		>
			{formControl ? <FormControl>{trigger}</FormControl> : trigger}
			<SelectContent>
				{optional && (
					<SelectItem value={emptyKey}>{placeholder ?? 'None'}</SelectItem>
				)}
				{options.map(item => (
					<SelectItem key={getKey(item)} value={String(getKey(item))}>
						{render(item)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
