import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { colorValueSchema } from '@shared/content'
import type { ColorType } from '@shared/json-value-types'
import { assoc, F, pipe, T } from 'ramda'
import PickerLib, { useColorPicker } from 'react-best-gradient-color-picker'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle
} from '@/components/ui/dialog'
import { notNil, setSignal, updateSignalFn } from '@/lib/signals'
import { Button } from './button'

type OpenProps = {
	callback: (color: ColorType['rgba']) => unknown
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
								colorValueSchema.parse({ rgba: rgbaArr }).rgba
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
