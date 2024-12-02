import FocusTravel from '@/components/utils/focus-travel'
import { range } from 'ramda'
import { ScrollArea } from '../scroll-area'
import { Month } from './month'

export const ScrollCalendar = () => {
	return (
		<div className="flex flex-row w-full gap-2 h-[290px]">
			<ScrollArea
				className="flex-1"
				fadeHeight={0}
				orientation="horizontal"
				viewPortClassName="flex flex-row [&>div]:!contents gap-4 items-start"
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
						<li key={year}>{year}</li>
					))}
				</ol>
			</ScrollArea>
		</div>
	)
}
