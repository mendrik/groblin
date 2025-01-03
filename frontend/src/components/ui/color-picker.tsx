import {
	Dialog,
	DialogContent,
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

export const ColorPicker = () => {
	const setColor = updateSignalFn($props, assoc('color'))
	const { rgbaArr } = useColorPicker(notNil($props).color, setColor)

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
				</VisuallyHidden>
				<PickerLib
					className="z-20"
					value={notNil($props).color}
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
