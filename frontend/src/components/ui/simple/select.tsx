import { CheckIcon } from '@radix-ui/react-icons'
import { SelectItemIndicator, SelectItemText } from '@radix-ui/react-select'
import { always, pipe, when } from 'ramda'
import { isNilOrEmpty } from 'ramda-adjunct'
import { FormControl } from '../form'
import {
	Select as RadixSelect,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../select'

type OwnProps = {
	record: Record<string, string>
	placeholder?: string
	optional: boolean
	defaultValue: string
	nullValue?: string | undefined | null
	onChange: <T>(value: T) => void
}

export const SimpleSelect = ({
	record,
	optional,
	placeholder,
	onChange,
	defaultValue,
	nullValue
}: OwnProps) => {
	console.dir(record)

	return (
		<RadixSelect
			onValueChange={pipe(when(isNilOrEmpty, always(undefined)), onChange)}
			defaultValue={defaultValue}
		>
			<FormControl>
				<SelectTrigger>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
			</FormControl>
			<SelectContent>
				{optional && (
					<SelectItem value={nullValue as string}>
						{placeholder ?? 'Reset'}
					</SelectItem>
				)}
				{Object.entries(record).map(([key, value]) => (
					<SelectItem value={`${value}`} key={value}>
						<SelectItemText>{key}</SelectItemText>
						<SelectItemIndicator>
							<CheckIcon />
						</SelectItemIndicator>
					</SelectItem>
				))}
			</SelectContent>
		</RadixSelect>
	)
}
