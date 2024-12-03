import {
	eachDayOfInterval,
	formatDate,
	isSameDay,
	lastDayOfMonth,
	lastDayOfWeek,
	startOfWeek
} from 'date-fns'
import './month.css'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { $viewDate, updateDay } from './date-picker-dialog'

type OwnProps = {
	month: number
	year: number
}

export const Month = forwardRef<HTMLDivElement, OwnProps>(
	({ month, year }, ref) => {
		const viewDate = $viewDate.value
		const first = new Date(viewDate.getFullYear(), month, 1)
		const from = startOfWeek(first, { weekStartsOn: 1 })
		const until = lastDayOfWeek(lastDayOfMonth(first), { weekStartsOn: 1 })
		const dates = eachDayOfInterval({ start: from, end: until })

		return (
			<div className="month min-w-full" id={`picker-month-${month}`} ref={ref}>
				<h2 className="headline">{formatDate(first, 'MMMM')}</h2>
				<ol className="weekdays">
					{dates.slice(0, 7).map(date => (
						<li key={date.getDay()}>{formatDate(date, 'EEE')}</li>
					))}
				</ol>
				<ol className="days">
					{dates.map(date => (
						<li key={date.toJSON()}>
							<button
								type="button"
								disabled={date.getMonth() !== month}
								className={cn({
									selected: isSameDay(date, viewDate),
									'text-muted': date.getMonth() !== month
								})}
								onClick={() => updateDay(date.getDate())}
							>
								{date.getDate()}
							</button>
						</li>
					))}
				</ol>
			</div>
		)
	}
)
