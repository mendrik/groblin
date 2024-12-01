import FocusTravel from '@/components/utils/focus-travel'
import { range } from 'ramda'
import { ScrollArea } from '../scroll-area'
import { Month } from './month'

export const ScrollCalendar = () => {
	return (
		<div className="flex flex-row w-full gap-2">
			<ScrollArea
				className="pr-4 max-h-[450px] flex-1"
				viewPortClassName="snap-y [&>div]:contents"
				fadeHeight={20}
			>
				<FocusTravel autoFocus={false}>
					{range(0, 12).map(month => (
						<Month key={month} month={month} year={2024} />
					))}
				</FocusTravel>
			</ScrollArea>
			<ScrollArea
				className="max-w-fit px-4 max-h-[450px] border-muted-foreground border-l"
				fadeHeight={100}
			>
				<ol className="flex flex-col gap-6">
					{range(1976, 2060).map(year => (
						<li key={year}>{year}</li>
					))}
				</ol>
			</ScrollArea>
		</div>
	)
}
