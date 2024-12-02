import FocusTravel from '@/components/utils/focus-travel'
import { range } from 'ramda'
import { ScrollArea } from '../scroll-area'
import { Month } from './month'

export const ScrollCalendar = () => {
	return (
		<div className="flex flex-row w-full gap-2">
			<ScrollArea viewPortClassName="h-[270px] overflow-hidden flex flex-row">
				<FocusTravel autoFocus={false}>
					{range(0, 12).map(month => (
						<Month key={month} month={month} year={2024} />
					))}
				</FocusTravel>
			</ScrollArea>
			<ScrollArea
				className="max-w-fit px-4 max-h-[200px] border-muted-foreground border-l"
				fadeHeight={50}
			>
				<ol className="flex flex-col gap-2">
					{range(1976, 2060).map(year => (
						<li key={year}>{year}</li>
					))}
				</ol>
			</ScrollArea>
		</div>
	)
}
