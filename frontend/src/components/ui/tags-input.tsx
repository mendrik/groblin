import { Badge } from '@/components/ui/badge'
import { inputValue } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { IconX } from '@tabler/icons-react'
import { assoc, pipe } from 'ramda'
import { type HTMLAttributes, forwardRef, useRef } from 'react'
import { useList } from 'react-use'
import FocusTravel from '../utils/focus-travel'
import KeyListener from '../utils/key-listener'
import { MicroIcon } from './random/micro-icon'

interface TagsInputProps extends HTMLAttributes<HTMLDivElement> {
	value: string[]
	onValueChange: (value: string[]) => void
	placeholder?: string
}

export const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(
	({ className, value, placeholder, ...props }, ref) => {
		const inputRef = useRef<HTMLInputElement>(null)
		const [values, { push }] = useList<string>(value)
		const clearInput = () => assoc('value', '', inputRef.current)
		return (
			<div
				ref={ref}
				className={cn(
					'bg-background border border-border rounded-sm flex flex-wrap flex-row gap-1 p-1',
					className
				)}
			>
				<KeyListener>
					<FocusTravel>
						{values.map((item, index) => (
							<Badge
								key={item}
								className={cn(
									"relative font-normal px-1 pl-2 rounded flex items-center gap-1 data-[active='true']:ring-2 data-[active='true']:ring-muted-foreground truncate aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
								)}
								variant={'secondary'}
							>
								<span className="text-sm">{item}</span>
								<MicroIcon icon={IconX} className="h-3 w-3" />
							</Badge>
						))}
					</FocusTravel>
				</KeyListener>
				<KeyListener onEnter={pipe(inputValue, push, clearInput)}>
					<input
						ref={inputRef}
						placeholder={placeholder}
						className={cn(
							'appearance-none border-none min-w-fit flex-1 bg-transparent text-sm p-1',
							'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50'
						)}
					/>
				</KeyListener>
			</div>
		)
	}
)

TagsInput.displayName = 'TagsInput'
