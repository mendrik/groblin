import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { F, T, pipe } from 'ramda'
import { Button } from '../button'
import { ScrollCalendar } from './scroll-calendar'

type OpenProps = {
	callback: (date: Date | undefined) => any
	date?: Date
}

const $dialogOpen = signal(true)
const $props = signal<OpenProps>({
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
				className="max-w-xs"
				close={close}
				closeButton={false}
				aria-describedby={undefined}
			>
				<VisuallyHidden>
					<DialogTitle>Date picker</DialogTitle>
				</VisuallyHidden>
				<ScrollCalendar />

				<DialogFooter className="gap-y-2">
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
