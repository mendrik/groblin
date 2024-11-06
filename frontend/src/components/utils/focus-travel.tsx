import {} from '@/lib/match'
import { hasMethod } from '@/lib/utils'
import { converge, dec, findIndex, identity, inc, pipe, sort } from 'ramda'
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
	[Direction.Right]: (a: DOMRect, b: DOMRect) => a.left - b.left,
	[Direction.Left]: (a: DOMRect, b: DOMRect) => a.left - b.left,
	[Direction.Up]: (a: DOMRect, b: DOMRect) => a.top - b.top,
	[Direction.Down]: (a: DOMRect, b: DOMRect) => a.top - b.top
}

const isLeftOrUp = (dir: Direction) =>
	dir === Direction.Left || dir === Direction.Up

const clampIndex = (idx: number, xs: HTMLElement[]) =>
	xs[(idx + xs.length) % xs.length]

const sortFocusable = (dir: Direction) =>
	sort<HTMLElement>((a, b) =>
		sorters[dir](a.getBoundingClientRect(), b.getBoundingClientRect())
	)

const focusNext = (dir: Direction) =>
	pipe(
		getFocusableElements(defaultFocusable),
		converge(clampIndex, [
			pipe(
				sortFocusable(dir),
				findIndex(e => e === document.activeElement),
				isLeftOrUp(dir) ? dec : inc
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
