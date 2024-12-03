import FocusTravel from '@/components/utils/focus-travel'
import { cn } from '@/lib/utils'
import { range } from 'ramda'
import { useRef } from 'react'
import { useEffectOnce, usePrevious, useUpdateEffect } from 'react-use'
import { ScrollArea } from '../scroll-area'
import { $viewDate, updateYear } from './date-picker-dialog'
import { Month } from './month'

export const ScrollCalendar = () => {
	const viewDate = $viewDate.value
	const currentYear = useRef<HTMLButtonElement>(null)
	const currentMonth = useRef<HTMLDivElement>(null)
	const prevMonth = usePrevious(viewDate.getMonth())

	const scroll = (
		behaviorMonth: 'smooth' | 'instant',
		behaviorYear: 'smooth' | 'instant'
	) => {
		currentYear.current?.scrollIntoView({
			block: 'center',
			behavior: behaviorYear
		})
		currentMonth.current?.scrollIntoView({
			block: 'center',
			behavior: behaviorMonth
		})
	}

	useUpdateEffect(() => {
		scroll(
			Math.abs((prevMonth ?? 0) - viewDate.getMonth()) <= 3
				? 'smooth'
				: 'instant',
			'smooth'
		)
	}, [viewDate, prevMonth])
	useEffectOnce(() => scroll('instant', 'instant'))

	return (
		<div className="flex flex-row w-full gap-2 h-[290px] ">
			<ScrollArea
				className="flex-1"
				fadeHeight={0}
				orientation="horizontal"
				viewPortClassName="flex flex-row [&>div]:!contents gap-4 items-start snap-x snap-mandatory"
			>
				<FocusTravel autoFocus={false}>
					{range(0, 12).map(month => (
						<Month
							key={month + viewDate.getFullYear()}
							month={month}
							year={2024}
							ref={month === viewDate.getMonth() ? currentMonth : undefined}
						/>
					))}
				</FocusTravel>
			</ScrollArea>
			<ScrollArea className="shrink-0 border-border border-l" fadeHeight={100}>
				<ol className="flex flex-col gap-2 px-4">
					{range(1930, 2060).map(year => (
						<li key={year}>
							<button
								type="button"
								ref={year === viewDate.getFullYear() ? currentYear : undefined}
								onClick={() => updateYear(year)}
								className={cn(
									year === viewDate.getFullYear()
										? 'text-foreground'
										: 'text-muted-foreground'
								)}
							>
								{year}
							</button>
						</li>
					))}
				</ol>
			</ScrollArea>
		</div>
	)
}
