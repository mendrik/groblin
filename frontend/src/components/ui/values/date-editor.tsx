import { format, parse } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { isNil, objOf, pipe, unless } from 'ramda'
import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { safeFormat } from '@/lib/date'
import { stopPropagation } from '@/lib/dom-events'
import { relativeTime } from '@/lib/relative-time'
import { openDatePicker } from '../date-picker/date-picker-dialog'
import { MicroIcon } from '../random/micro-icon'
import { DateProps } from '../tree/properties/dates'
import type { ValueEditor } from './value-editor'

type DateValue = Omit<Value, 'value'> & {
	value: {
		date: string
	}
}

type DateRenderProps = {
	date: Date
}

const RelativeDate = ({ date }: DateRenderProps) => (
	<span className="mt-1">{relativeTime({})(date)}</span>
)
const AbsoluteDate = ({ date }: DateRenderProps) => (
	<span className="mt-1">{safeFormat(date, 'dd.MM.yyyy')}</span>
)

export const DateEditor: ValueEditor<DateValue> = ({
	settings: rawSettings,
	value,
	save
}) => {
	const settings = DateProps.parse(rawSettings ?? {})
	const date = value
		? parse(value.value.date, 'yyyy-MM-dd', new Date())
		: undefined
	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<div className="flex items-center flex-row gap-1 h-7 whitespace-nowrap">
				{date &&
					(settings?.relative ? (
						<RelativeDate date={date} />
					) : (
						<AbsoluteDate date={date} />
					))}
				<MicroIcon
					icon={CalendarDays}
					onClick={() =>
						openDatePicker({
							date,
							callback: unless(
								isNil,
								pipe(d => format(d, 'yyyy-MM-dd'), objOf('date'), save)
							)
						})
					}
				/>
			</div>
		</KeyListener>
	)
}
