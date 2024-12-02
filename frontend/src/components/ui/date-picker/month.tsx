import {
	eachDayOfInterval,
	formatDate,
	lastDayOfMonth,
	lastDayOfWeek,
	startOfWeek
} from 'date-fns'
import './month.css'
import { cn } from '@/lib/utils'

type OwnProps = {
	month: number
	year: number
}

export const Month = ({ month, year }: OwnProps) => {
	const first = new Date(year, month, 1)
	const from = startOfWeek(first, { weekStartsOn: 1 })
	const until = lastDayOfWeek(lastDayOfMonth(first), { weekStartsOn: 1 })
	const dates = eachDayOfInterval({ start: from, end: until })

	return (
		<div className="month min-w-full" id={`picker-month-${month}`}>
			<h2 className="headline">{formatDate(first, 'MMMM')}</h2>
			<ol className="weekdays">
				{dates.slice(0, 7).map(date => (
					<li key={date.getTime()}>{formatDate(date, 'EEE')}</li>
				))}
			</ol>
			<ol className="days">
				{dates.map(date => (
					<li key={date.getTime()}>
						<button
							type="button"
							disabled={date.getMonth() !== month}
							className={cn({
								'text-muted': date.getMonth() !== month
							})}
						>
							{date.getDate()}
						</button>
					</li>
				))}
			</ol>
		</div>
	)
}
