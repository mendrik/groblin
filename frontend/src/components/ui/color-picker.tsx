import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Slider as RxSlider } from '@/components/ui/slider'
import { values } from 'ramda'
import { Input } from './input'
import { SimpleSelect } from './simple/select'
import './color-picker.css'
import ColorWheel from './color-wheel'

type SliderProps = {
	component: string
}

const Slider = ({ component }: SliderProps) => {
	return (
		<div className="slider">
			<div>{component}</div>
			<RxSlider />
			<Input className="text-xs p-2 h-6" maxLength={3} />
		</div>
	)
}

export default ColorWheel

enum ColorModel {
	RGB = 0,
	HSL = 1
}

export const ColorPicker = () => {
	return (
		<Dialog open={true}>
			<DialogContent className="max-w-xs" close={close}>
				<DialogHeader>
					<DialogTitle>Color picker</DialogTitle>
				</DialogHeader>
				<div className="color-picker">
					<div className="circle">
						<ColorWheel />
					</div>
					<div className="model">
						<div className="label">Model</div>
						<SimpleSelect
							options={values(ColorModel)}
							render={toString}
							value={ColorModel.RGB}
							onChange={() => void 0}
						/>
					</div>
					<Slider component="R" />
					<Slider component="G" />
					<Slider component="B" />
					<Slider component="A" />
				</div>
			</DialogContent>
		</Dialog>
	)
}
