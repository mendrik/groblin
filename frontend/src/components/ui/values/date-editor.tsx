import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { relativeTime } from '@/lib/relative-time'
import { IconCalendar } from '@tabler/icons-react'
import { formatDate, parseJSON } from 'date-fns'
import { objOf, pipe, when } from 'ramda'
import { isString } from 'ramda-adjunct'
import { openDatePicker } from '../date-picker/date-picker-dialog'
import { MicroIcon } from '../random/micro-icon'
import type { DateProps } from '../tree/properties/dates'
import type { ValueEditor } from './value-editor'

type DateValue = Omit<Value, 'value'> & {
	value: {
		date: Date
	}
}

const safeParse: (date?: string) => Date | undefined = when(isString, parseJSON)

type DateRenderProps = {
	date: Date
}

const RelativeDate = ({ date }: DateRenderProps) => (
	<span>{relativeTime({})(date)}</span>
)
const AbsoluteDate = ({ date }: DateRenderProps) => (
	<span>{formatDate(date, 'dd.MM.yyyy')}</span>
)

export const DateEditor: ValueEditor<DateValue, DateProps> = ({
	settings,
	value,
	save
}) => {
	const date = safeParse(value?.value.date)
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
					icon={IconCalendar}
					onClick={() =>
						openDatePicker({
							date,
							callback: pipe(objOf('date'), save)
						})
					}
				/>
			</div>
		</KeyListener>
	)
}
