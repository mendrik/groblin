import { inputValue, preventDefault, stopPropagation } from '@/lib/dom-events'
import { setSignal, updateSignal } from '@/lib/signals'
import { cn } from '@/lib/utils'
import { useSignal, useSignalEffect } from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import { removeAt } from '@shared/utils/ramda'
import { append, dropLast, isEmpty, isNotEmpty, objOf, pipe, when } from 'ramda'
import {
	type HTMLAttributes,
	type RefObject,
	useLayoutEffect,
	useRef
} from 'react'
import KeyListener from '../utils/key-listener'
import { SortContext } from '../utils/sort-context'
import { SortableItem } from '../utils/sortable-item'

interface TagsInputProps extends HTMLAttributes<HTMLDivElement> {
	value: string[]
	onValueChange: (value: string[]) => void
	placeholder?: string
}

const tagName = pipe(preventDefault, stopPropagation, inputValue)

export const TagsInput = ({
	className,
	value,
	placeholder,
	onValueChange,
	...props
}: TagsInputProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const measureRef = useRef<HTMLDivElement>(null)
	const active = useSignal<string>('')
	const list = useSignal<string[]>(value)
	const toFocus = useSignal<number>(-1)

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

	const deleteActive = () => {
		const idx = list.value.indexOf(active.value)
		updateSignal(list, removeAt(idx))
		setSignal(toFocus, idx)
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: we cannot useSignalEffect here
	useLayoutEffect(() => {
		if (toFocus.value === -1) return
		const foc = containerRef.current
			?.querySelectorAll('.badge')
			.item(toFocus.value)
		if (foc instanceof HTMLElement) {
			foc.focus()
			toFocus.value = -1
		} else {
			inputRef.current?.focus()
		}
	}, [toFocus.value])

	useSignalEffect(() => {
		onValueChange(list.value)
	})

	const deleteLast = () => updateSignal(list, dropLast(1))
	const push = (el: string) => updateSignal(list, append(el))
	const focusLast = () => {
		setSignal(toFocus, list.value.length - 1)
	}
	const moveLeft = () => {
		const idx = list.value.indexOf(active.value)
		setSignal(toFocus, idx > 0 ? idx - 1 : list.value.length - 1)
	}
	const moveRight = () => {
		const idx = list.value.indexOf(active.value)
		setSignal(toFocus, idx === list.value.length - 1 ? 0 : idx + 1)
	}

	return (
		<div
			{...props}
			// biome-ignore lint/a11y/useSemanticElements: <explanation>
			role="textbox"
			tabIndex={0}
			onFocus={pipe(stopPropagation, e => ref(inputRef).focus())}
			className={cn(
				'bg-background border border-input rounded-sm flex flex-wrap flex-row gap-1 p-1 cursor-text',
				className
			)}
		>
			<SortContext
				values={list.value.map(objOf('id'))}
				onDragEnd={() => console.log('drag end')}
			>
				<KeyListener
					onDelete={deleteActive}
					onBackspace={deleteActive}
					onArrowLeft={moveLeft}
					onArrowRight={moveRight}
					ref={containerRef}
				>
					{list.value.map((item, index) => (
						<SortableItem
							className={cn(
								'badge rounded flex grow-0 select-none items-center gap-1',
								'relative font-normal px-2 border border-border truncate transition-colors',
								'focus-visible:outline-none focus-visible:ring-1 focus:ring-offset-0 focus:ring-1 focus-visible:ring-ring focus:ring-ring'
							)}
							id={item}
							onFocus={pipe(stopPropagation, () => setSignal(active, item))}
							tabIndex={0}
							renderer={() => <span className="text-sm">{item}</span>}
							key={`${index}-${item}`}
						/>
					))}
				</KeyListener>
			</SortContext>
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
					onBlur={pipe(tagName, when(isNotEmpty, push), clearInput)}
					className={cn(
						'[&[style]]:placeholder-transparent',
						'border-none appearance-none bg-transparent text-sm p-1 min-w-0 flex-grow basis-5',
						'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50'
					)}
				/>
			</KeyListener>
		</div>
	)
}
