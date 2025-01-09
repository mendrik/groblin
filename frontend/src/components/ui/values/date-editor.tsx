import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { relativeTime } from '@/lib/relative-time'
import { caseOf, match } from '@shared/utils/match'
import { IconCalendar } from '@tabler/icons-react'
import { formatDate, parseJSON } from 'date-fns'
import { T as _, isNil, objOf, pipe, tryCatch, unless } from 'ramda'
import { isDate, isString, isValidDate } from 'ramda-adjunct'
import { openDatePicker } from '../date-picker/date-picker-dialog'
import { MicroIcon } from '../random/micro-icon'
import type { DateProps } from '../tree/properties/dates'
import type { ValueEditor } from './value-editor'

type DateValue = Omit<Value, 'value'> & {
	value: {
		date: string | Date
	}
}

const validDate = unless(isValidDate, () => undefined)

const safeParse = match<[Date | string | undefined], Date | undefined>(
	caseOf([isDate], validDate),
	caseOf([isString], pipe(parseJSON, validDate)),
	caseOf([_], () => undefined)
)

const safeFormat = tryCatch(formatDate, () => undefined)

type DateRenderProps = {
	date: Date
}

const RelativeDate = ({ date }: DateRenderProps) => (
	<span>{relativeTime({})(date)}</span>
)
const AbsoluteDate = ({ date }: DateRenderProps) => (
	<span>{safeFormat(date, 'dd.MM.yyyy')}</span>
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
							callback: unless(isNil, pipe(objOf('date'), save))
						})
					}
				/>
			</div>
		</KeyListener>
	)
}
