import {} from '@/lib/match'
import { hasMethod } from '@/lib/utils'
import { converge, findIndex, identity, inc, o, pipe, sort } from 'ramda'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import KeyListener from './key-listener'

type OwnProps = PropsWithChildren<{
	focusableSelector?: string
}>

enum Direction {
	Right = 'Right',
	Left = 'Left',
	Up = 'Up',
	Down = 'Down'
}

const defaultFocusable =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const focusFirst = (focusableSelector: string) => (el: HTMLElement | null) => {
	const focusable = el?.querySelector(focusableSelector)
	if (hasMethod(focusable, 'focus')) setTimeout(() => focusable.focus(), 40)
}

const getFocusableElements = (selector: string) => (el: HTMLElement | null) =>
	Array.from(el?.querySelectorAll(selector) ?? []) as HTMLElement[]

const sorters = {
	[Direction.Right]: (a: DOMRect, b: DOMRect) => {
		return a.top - b.top || a.left - b.left
	},
	[Direction.Left]: (a: DOMRect, b: DOMRect) => {
		return b.top - a.top || b.left - a.left
	},
	[Direction.Up]: (a: DOMRect, b: DOMRect) => {
		return b.top - a.top || a.left - b.left
	},
	[Direction.Down]: (a: DOMRect, b: DOMRect) => {
		return a.top - b.top || b.left - a.left
	}
}

const clampIndex = (idx: number, xs: HTMLElement[]) =>
	xs[(idx + xs.length) % xs.length]

const sortFocusable = (dir: Direction) =>
	sort<HTMLElement>((a, b) =>
		sorters[dir](a.getBoundingClientRect(), b.getBoundingClientRect())
	)

const focusNext = (dir: Direction) =>
	pipe(
		getFocusableElements(defaultFocusable),
		sortFocusable(dir),
		converge(clampIndex, [
			o(
				inc,
				findIndex(e => e === document.activeElement)
			),
			identity
		]),
		(el: HTMLElement) => el.focus()
	)

const FocusTravel = ({
	focusableSelector = defaultFocusable,
	children
}: OwnProps) => {
	const ref = useRef<HTMLDivElement>(null)

	const focus = (dir: Direction) => (ev: Event) => {
		if (ref.current) {
			ev.preventDefault() // Prevent default scrolling behavior
			ev.stopImmediatePropagation()
			focusNext(dir)(ref.current)
		}
	}

	useEffect(() => {
		focusFirst(focusableSelector)(ref.current)
	}, [focusableSelector])

	return (
		<KeyListener
			onArrowUp={focus(Direction.Up)}
			onArrowDown={focus(Direction.Down)}
			onArrowLeft={focus(Direction.Left)}
			onArrowRight={focus(Direction.Right)}
			ref={ref}
		>
			{children}
		</KeyListener>
	)
}

FocusTravel.displayName = 'FocusTravel'
export default FocusTravel
