import FocusTravel from '@/components/utils/focus-travel'
import { cn } from '@/lib/utils'
import { range } from 'ramda'
import { useLayoutEffect, useRef } from 'react'
import { ScrollArea } from '../scroll-area'
import { $viewDate, updateYear } from './date-picker-dialog'
import { Month } from './month'

export const ScrollCalendar = () => {
	const viewDate = $viewDate.value
	const currentYear = useRef<HTMLButtonElement>(null)
	const currentMonth = useRef<HTMLDivElement>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: viewDate triggers the scroll
	useLayoutEffect(() => {
		currentYear.current?.scrollIntoView({ block: 'center' })
		currentMonth.current?.scrollIntoView({ block: 'center' })
	}, [viewDate])

	return (
		<div className="flex flex-row w-full gap-2 h-[290px] ">
			<ScrollArea
				className="flex-1"
				fadeHeight={0}
				orientation="horizontal"
				viewPortClassName="flex flex-row [&>div]:!contents gap-4 items-start snap-x snap-mandatory scroll-smooth"
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
