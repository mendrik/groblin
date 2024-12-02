import FocusTravel from '@/components/utils/focus-travel'
import { range } from 'ramda'
import { useLayoutEffect, useRef } from 'react'
import { ScrollArea } from '../scroll-area'
import { $props } from './date-picker-dialog'
import { Month } from './month'

type OwnProps = {
	date: Date
}

export const ScrollCalendar = ({ date }: OwnProps) => {
	const currentYear = useRef<HTMLButtonElement>(null)

	useLayoutEffect(() => {
		currentYear.current?.scrollIntoView({ block: 'center' })
	})

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
						<Month key={month} month={month} year={2024} />
					))}
				</FocusTravel>
			</ScrollArea>
			<ScrollArea className="shrink-0 border-border border-l" fadeHeight={100}>
				<ol className="flex flex-col gap-2 px-4">
					{range(1976, 2060).map(year => (
						<li key={year}>
							<button
								type="button"
								ref={year === date.getFullYear() ? currentYear : undefined}
								onClick={() => $props.value.date.setFullYear(year)}
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
