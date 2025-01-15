import {
	eachDayOfInterval,
	formatDate,
	isSameDay,
	lastDayOfMonth,
	lastDayOfWeek,
	startOfWeek
} from 'date-fns'
import './month.css'
import { setSignal } from '@/lib/signals'
import { cn } from '@/lib/utils'

import { forwardRef } from 'react'
import { Button } from '../button'
import { $viewDate, updateMonth } from './date-picker-dialog'

type OwnProps = {
	month: number
	year: number
}

export const Month = forwardRef<HTMLDivElement, OwnProps>(
	({ month, year }, ref) => {
		const viewDate = $viewDate.value
		const first = new Date(viewDate.getFullYear(), month, 1)
		const from = startOfWeek(first)
		const until = lastDayOfWeek(lastDayOfMonth(first))
		const dates = eachDayOfInterval({ start: from, end: until })

		return (
			<div className="month min-w-full" id={`picker-month-${month}`} ref={ref}>
				<div className="header">
					<Button
						variant="ghost"
						size="icon"
						className="mr-auto"
						onClick={() => updateMonth(month - 1)}
					>
						<IconChevronLeft stroke={1.5} />
					</Button>
					<h2 className="headline">{formatDate(first, 'LLLL')}</h2>
					<Button
						variant="ghost"
						size="icon"
						className="ml-auto"
						onClick={() => updateMonth(month + 1)}
					>
						<IconChevronRight stroke={1.5} />
					</Button>
				</div>
				<ol className="weekdays">
					{dates.slice(0, 7).map(date => (
						<li key={date.getDay()}>{formatDate(date, 'EEEEEE')}</li>
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
								onClick={() => setSignal($viewDate, date)}
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
