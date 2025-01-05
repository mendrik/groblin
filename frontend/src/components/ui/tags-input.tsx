import { inputValue, stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { assertExists } from '@shared/asserts'
import { isEmpty, last, nth, objOf, pipe, when } from 'ramda'
import {
	type HTMLAttributes,
	forwardRef,
	useEffect,
	useRef,
	useState
} from 'react'
import { useList } from 'react-use'
import FocusTravel from '../utils/focus-travel'
import KeyListener from '../utils/key-listener'
import { SortContext } from '../utils/sort-context'
import { SortableItem } from '../utils/sortable-item'

interface TagsInputProps extends HTMLAttributes<HTMLDivElement> {
	value: string[]
	onValueChange: (value: string[]) => void
	placeholder?: string
}

export const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(
	({ className, value, placeholder, onValueChange, ...props }, ref) => {
		const containerRef = useRef<HTMLDivElement>(null)
		const inputRef = useRef<HTMLInputElement>(null)
		const measureRef = useRef<HTMLDivElement>(null)
		const [values, { push, removeAt }] = useList<string>(value)
		const [active, setActive] = useState<number>(-1)
		const clearInput = () => {
			const inp = inputRef.current
			assertExists(inp, 'inputRef.current')
			inp.value = ''
		}
		const adjustWidth = (value: string) => {
			const mDiv = measureRef.current
			assertExists(mDiv, 'measureRef.current')
			const inp = inputRef.current
			assertExists(inp, 'inp.current')
			mDiv.innerText = value
			const { width } = mDiv.getBoundingClientRect()
			inp.style.maxWidth = `${Math.max(width, 40)}px`
		}
		const badges = () => {
			assertExists(containerRef.current, 'containerRef.current')
			return Array.from(
				containerRef.current.querySelectorAll<HTMLElement>('.badge')
			)
		}
		const deleteAt = (idx: number) => {
			const b = badges()
			removeAt(idx)
			if (b.length === 1) {
				const inp = inputRef.current
				assertExists(inp, 'inputRef.current')
				inp.focus()
			} else {
				nth(idx - 1, b)?.focus()
			}
		}
		const deleteLast = () => deleteAt(values.length - 1)
		const focusLast = () => {
			last(badges())?.focus()
		}

		useEffect(() => onValueChange(values), [values, onValueChange])

		return (
			<SortContext
				values={values.map(objOf('id'))}
				onDragEnd={() => console.log('drag end')}
			>
				<div
					ref={ref}
					// biome-ignore lint/a11y/useSemanticElements: <explanation>
					role="textbox"
					tabIndex={0}
					onFocus={e => inputRef.current?.focus()}
					onKeyDown={e => void 0}
					className={cn(
						'bg-background border border-input rounded-sm flex flex-wrap flex-row gap-1 p-1',
						className
					)}
				>
					<KeyListener
						onDelete={() => deleteAt(active)}
						onBackspace={() => deleteAt(active)}
						ref={containerRef}
					>
						<FocusTravel>
							{values.map((item, index) => (
								<SortableItem
									className={cn(
										'badge rounded flex grow-0 select-none items-center gap-1',
										'relative font-normal px-2 border border-border truncate transition-colors',
										'focus-visible:outline-none focus-visible:ring-1 focus:ring-offset-0 focus:ring-1 focus-visible:ring-ring focus:ring-ring'
									)}
									id={item}
									onFocus={pipe(stopPropagation, () => setActive(index))}
									onBlur={() => setActive(-1)}
									tabIndex={0}
									renderer={() => <span className="text-sm">{item}</span>}
									key={`${
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										index
									}`}
								/>
							))}
						</FocusTravel>
					</KeyListener>
					<KeyListener
						onEnter={pipe(inputValue, push, clearInput)}
						onBackspace={pipe(inputValue, when(isEmpty, deleteLast))}
						onArrowLeft={pipe(inputValue, when(isEmpty, focusLast))}
					>
						<div
							className="text-sm px-1 opacity-0 pointer-events-none absolute"
							ref={measureRef}
						/>
						<input
							ref={inputRef}
							placeholder={placeholder}
							onChange={pipe(inputValue, adjustWidth)}
							className={cn(
								'border-none',
								'flex-grow appearance-none flex-1 bg-transparent text-sm p-1 w-fit',
								'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50'
							)}
						/>
					</KeyListener>
				</div>
			</SortContext>
		)
	}
)

TagsInput.displayName = 'TagsInput'
function useActive<T>(value: string[]): [any, { push: any; removeAt: any }] {
	throw new Error('Function not implemented.')
}
