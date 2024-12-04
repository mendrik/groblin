import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle
} from '@/components/ui/dialog'
import { cn, setSignal, updateSignalFn } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { IconBan } from '@tabler/icons-react'
import { formatDate } from 'date-fns'
import { setDate, setMonth, setYear } from 'date-fns/fp'
import { F, pipe, range } from 'ramda'
import { Button } from '../button'
import { MaskedDateInput } from './masked-date-input'
import { ScrollCalendar } from './scroll-calendar'

type OpenProps = {
	callback: (date: Date | undefined) => any
	date?: Date
}

const $dialogOpen = signal(false)
export const $viewDate = signal<Date>(new Date())
export const $callback = signal<(date: Date) => unknown>(() => void 0)

export const openDatePicker = (props: OpenProps) => {
	setSignal($viewDate, props.date ?? new Date())
	setSignal($callback, props.callback)
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))
export const updateMonth = updateSignalFn($viewDate, setMonth)
export const updateYear = updateSignalFn($viewDate, setYear)
export const updateDay = updateSignalFn($viewDate, setDate)

export const DatePicker = () => {
	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent
				className="max-w-sm px-4 pt-4 gap-0"
				close={close}
				closeButton={false}
				aria-describedby={undefined}
			>
				<VisuallyHidden>
					<DialogTitle>Date picker</DialogTitle>
				</VisuallyHidden>
				<ol
					className={cn(
						'flex flex-row w-full justify-between content-center',
						'text-muted-foreground border-b border-border pb-4'
					)}
				>
					{range(0, 12).map(month => (
						<li key={month} className="text-xs">
							<button
								type="button"
								className={cn(
									'hover:text-foreground',
									month === $viewDate.value.getMonth() && 'text-foreground'
								)}
								onClick={() => updateMonth(month)}
							>
								{formatDate(new Date(2024, month, 1), 'MMM').substring(0, 3)}
							</button>
						</li>
					))}
				</ol>
				<ScrollCalendar />
				<DialogFooter className="flex flex-row gap-y-2 pt-4 border-t border-border">
					<MaskedDateInput className="mr-auto font-mono" />
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setSignal($viewDate, new Date())}
					>
						<IconBan stroke={1.5} />
					</Button>
					<Button onClick={close} variant="secondary">
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							$callback.value($viewDate.value)
							close()
						}}
					>
						Accept
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
