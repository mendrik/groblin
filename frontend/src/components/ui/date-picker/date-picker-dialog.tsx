import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle
} from '@/components/ui/dialog'
import { cn, setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { formatDate } from 'date-fns'
import { F, T, pipe, range } from 'ramda'
import { Button } from '../button'
import { MaskedDateInput } from './masked-date-input'
import { ScrollCalendar } from './scroll-calendar'

type OpenProps = {
	callback: (date: Date | undefined) => any
	date: Date
}

const $dialogOpen = signal(true)
export const $props = signal<OpenProps>({
	callback: () => {},
	date: new Date()
})

export const openDatePicker: (props: OpenProps) => void = pipe(
	setSignal($props),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

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
								className="hover:text-foreground"
								onClick={() =>
									document
										.getElementById(`picker-month-${month}`)
										?.scrollIntoView({
											behavior: 'smooth',
											block: 'center'
										})
								}
							>
								{formatDate(new Date(2024, month, 1), 'MMM')}
							</button>
						</li>
					))}
				</ol>
				<ScrollCalendar date={$props.value.date} />
				<DialogFooter className="flex flex-row gap-y-2 pt-4 border-t border-border">
					<MaskedDateInput className="mr-auto" date={$props.value.date} />
					<Button onClick={close} variant="secondary">
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							$props.value.callback($props.value.date)
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
