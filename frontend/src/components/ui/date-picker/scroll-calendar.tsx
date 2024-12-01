import { Month } from './month'

export const ScrollCalendar = () => {
	return (
		<div className="h-[300px]">
			<Month month={11} year={2024} />
		</div>
	)
}
