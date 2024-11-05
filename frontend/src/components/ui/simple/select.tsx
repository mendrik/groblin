import { SelectItemText } from '@radix-ui/react-select'
import {} from 'ramda'
import { DropdownMenuItem } from '../dropdown-menu'
import { FormControl } from '../form'
import {
	Select as Root,
	SelectContent,
	SelectTrigger,
	SelectValue
} from '../select'

type OwnProps<T> = {
	options: Map<T, string>
	placeholder?: string
	optional: boolean
	defaultValue: T
	onChange: (value: T) => void
}

export const SimpleSelect = <T,>({
	options,
	optional,
	placeholder,
	onChange,
	defaultValue
}: OwnProps<T>) => {
	const currentItem = options.get(defaultValue)
	return (
		<Root onValueChange={console.log}>
			<FormControl>
				<SelectTrigger>
					<SelectValue placeholder={placeholder}>{currentItem}</SelectValue>
				</SelectTrigger>
			</FormControl>
			<SelectContent>
				{optional && (
					<div>
						<SelectItemText>{placeholder ?? 'Reset'}</SelectItemText>
					</div>
				)}
				{Array.from(options.entries()).map(([key, value]) => (
					<DropdownMenuItem onSelect={console.log} key={value}>
						{value}
					</DropdownMenuItem>
				))}
			</SelectContent>
		</Root>
	)
}
