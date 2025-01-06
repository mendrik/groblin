import { inputValue, preventDefault, stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import { assertExists } from '@shared/asserts'
import { isEmpty, isNotEmpty, last, nth, objOf, pipe, when } from 'ramda'
import {
	type HTMLAttributes,
	type RefObject,
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

const tagName = pipe(preventDefault, stopPropagation, inputValue)

export const TagsInput = forwardRef<HTMLDivElement, TagsInputProps>(
	({ className, value, placeholder, onValueChange, ...props }, fref) => {
		const containerRef = useRef<HTMLDivElement>(null)
		const inputRef = useRef<HTMLInputElement>(null)
		const measureRef = useRef<HTMLDivElement>(null)
		const [values, { push, removeAt }] = useList<string>(value)
		const [active, setActive] = useState<number>(-1)

		const ref = <T,>(ref: RefObject<T | null>): T => {
			const inp = ref.current
			assertExists(inp, 'ref.current missing')
			return inp
		}

		const clearInput = () => (ref(inputRef).value = '')

		const adjustWidth = (value: string) => {
			const mDiv = ref(measureRef)
			mDiv.innerText = value
			const { width } = mDiv.getBoundingClientRect()
			ref(inputRef).style.maxWidth = `${Math.max(width, 40)}px`
		}

		const badges = () =>
			Array.from(ref(containerRef).querySelectorAll<HTMLElement>('.badge'))

		const deleteAt = (idx: number) => {
			const b = nth(idx - 1, badges())
			removeAt(idx)
			b?.focus() ?? ref(inputRef).focus()
		}

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			onValueChange(values)
		}, [values])

		const deleteLast = () => deleteAt(values.length - 1)

		const focusLast = () => last(badges())?.focus()

		return (
			<SortContext
				values={values.map(objOf('id'))}
				onDragEnd={() => console.log('drag end')}
			>
				<div
					ref={fref}
					// biome-ignore lint/a11y/useSemanticElements: <explanation>
					role="textbox"
					tabIndex={0}
					onFocus={e => ref(inputRef).focus()}
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
									tabIndex={0}
									renderer={() => <span className="text-sm">{item}</span>}
									key={`${index}-${item}`}
								/>
							))}
						</FocusTravel>
					</KeyListener>
					<div
						className="text-sm px-1 opacity-0 pointer-events-none absolute"
						ref={measureRef}
					/>
					<KeyListener
						onEnter={pipe(tagName, when(isNotEmpty, push), clearInput)}
						onBackspace={pipe(inputValue, when(isEmpty, deleteLast))}
						onArrowLeft={pipe(tagName, when(isEmpty, focusLast))}
					>
						<input
							ref={inputRef}
							placeholder={placeholder}
							onChange={pipe(tagName, adjustWidth)}
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
