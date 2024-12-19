import FocusTravel from '@/components/utils/focus-travel'
import { cn } from '@/lib/utils'
import {
	type ButtonHTMLAttributes,
	type ReactNode,
	forwardRef,
	useRef,
	useState
} from 'react'
import { Select, SelectContent, SelectTrigger } from '../select'

type OwnProps<T> = {
	options: T[]
	render: (item: T) => ReactNode
	placeholder?: string
	optional?: boolean
	value: T | undefined
	onChange: (value: T | undefined) => void
}

const SelectItem = forwardRef<
	HTMLButtonElement,
	ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
	<button
		{...props}
		type="button"
		ref={ref}
		className={cn(
			className,
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8',
			'text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent'
		)}
	>
		{children}
	</button>
))
SelectItem.displayName = 'SelectItem'

export const SimpleSelect = <T,>({
	options,
	optional = false,
	placeholder,
	onChange,
	value,
	render
}: OwnProps<T>) => {
	const [open, setOpen] = useState(false)
	const selectables = useRef(new Array(options.length).fill(null))
	const currentItem = value && render(value)

	return (
		<Select onOpenChange={setOpen} open={open}>
			<SelectTrigger>{currentItem ?? placeholder}</SelectTrigger>
			<SelectContent>
				<FocusTravel>
					{optional && (
						<SelectItem
							key="null"
							onClick={() => {
								onChange(undefined)
								setOpen(false)
							}}
						>
							{placeholder}
						</SelectItem>
					)}
					{options.map((value, idx) => (
						<SelectItem
							key={`${idx}-${render(value)}`}
							ref={el => {
								selectables.current[idx] = el
							}}
							onClick={() => {
								onChange(value)
								setOpen(false)
							}}
						>
							{render(value)}
						</SelectItem>
					))}
				</FocusTravel>
			</SelectContent>
		</Select>
	)
}
