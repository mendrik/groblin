import {
	eachDayOfInterval,
	formatDate,
	lastDayOfMonth,
	lastDayOfWeek,
	startOfWeek
} from 'date-fns'
import './month.css'
import { take } from 'ramda'

type OwnProps = {
	month: number
	year: number
}

export const Month = ({ month, year }: OwnProps) => {
	const first = new Date(year, month, 1)
	const from = startOfWeek(first, { weekStartsOn: 1 })
	const until = lastDayOfWeek(lastDayOfMonth(first), { weekStartsOn: 1 })
	const dates = eachDayOfInterval({ start: from, end: until })
	const firstWeek = take(7, dates)

	return (
		<div className="month">
			<ol className="weekdays">
				{firstWeek.map(date => (
					<li key={date.getTime()}>{formatDate(date, 'EEEEEE')}</li>
				))}
			</ol>
			<ol className="days">
				{dates.map(date => (
					<button type="button" key={date.getTime()}>
						{date.getDate()}
					</button>
				))}
			</ol>
		</div>
	)
}
