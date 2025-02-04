import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/signals'
import { updateSignalFn } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { F, T, assoc, pipe } from 'ramda'
import PickerLib, { useColorPicker } from 'react-best-gradient-color-picker'
import { Button } from './button'

type OpenProps = {
	callback: (color: [number, number, number, number?]) => any
	color: string
}

const $dialogOpen = signal(false)
const $props = signal<OpenProps>({
	callback: () => {},
	color: 'rgba(255, 0, 0, 1)'
})

export const openColorPicker: (props: OpenProps) => void = pipe(
	setSignal($props),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

const setColor = updateSignalFn($props, assoc('color'))

export const ColorPicker = () => {
	const color = notNil($props).color
	const { rgbaArr } = useColorPicker(color, setColor)

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent
				className="max-w-xs"
				close={close}
				closeButton={false}
				aria-describedby={undefined}
			>
				<VisuallyHidden>
					<DialogTitle>Color picker</DialogTitle>
					<DialogDescription>Pick a color</DialogDescription>
				</VisuallyHidden>
				<PickerLib
					className="z-20"
					value={color}
					width={270}
					height={170}
					onChange={setColor}
					hideEyeDrop
					hideColorGuide
					hideColorTypeBtns
					hideGradientControls
					hidePresets
				/>
				<DialogFooter className="gap-y-2">
					<Button onClick={close} variant="secondary">
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							notNil($props).callback(
								rgbaArr as [number, number, number, number?]
							)
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
