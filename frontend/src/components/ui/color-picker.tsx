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
import { useState } from 'react'
import PickerLib, { useColorPicker } from 'react-best-gradient-color-picker'
import { Button } from './button'

type Callback = (color: number[]) => any
const $dialogOpen = signal(false)
const $selectColorCallback = signal<Callback>()

export const openColorPicker: (cb: Callback) => void = pipe(
	setSignal($selectColorCallback),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

export const ColorPicker = () => {
	const [color, setColor] = useState('rgba(255,255,255,1)')
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
					<DialogTitle>Color Picker</DialogTitle>
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
							$selectColorCallback.value?.(rgbaArr)
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
