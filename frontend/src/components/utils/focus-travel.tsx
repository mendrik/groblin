import {} from '@/lib/match'
import { hasMethod } from '@/lib/utils'
import {
	converge,
	equals,
	findIndex,
	identity,
	inc,
	o,
	pipe,
	reject,
	sort
} from 'ramda'
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

const rowOrColumn = (dir: Direction, active: Element | null) =>
	reject<HTMLElement>(el => {
		if (active === null) return true
		const r = el.getBoundingClientRect()
		const a = active.getBoundingClientRect()
		return dir === Direction.Right || dir === Direction.Left
			? Math.abs(r.top - a.top) > 10
			: Math.abs(r.left - a.left) > 10
	})

const sorters = {
	[Direction.Right]: (a: DOMRect, b: DOMRect) => a.left - b.left,
	[Direction.Left]: (a: DOMRect, b: DOMRect) => b.left - a.left,
	[Direction.Up]: (a: DOMRect, b: DOMRect) => b.top - a.top,
	[Direction.Down]: (a: DOMRect, b: DOMRect) => a.top - b.top
}

const clampIndex = (idx: number, xs: HTMLElement[]) =>
	xs[(idx + xs.length) % xs.length]

const sortFocusable = (dir: Direction) =>
	sort<HTMLElement>((a, b) =>
		sorters[dir](a.getBoundingClientRect(), b.getBoundingClientRect())
	)

const focusNext = (dir: Direction, active = document.activeElement) =>
	pipe(
		getFocusableElements(defaultFocusable),
		rowOrColumn(dir, active),
		sortFocusable(dir),
		converge(clampIndex, [o(inc, findIndex(equals(active))), identity]),
		(el: HTMLElement | null) => el?.focus()
	)

const FocusTravel = ({
	focusableSelector = defaultFocusable,
	children
}: OwnProps) => {
	const ref = useRef<HTMLDivElement>(null)

	const focus = (dir: Direction) => (ev: Event) => {
		ev.preventDefault() // Prevent default scrolling behavior
		ev.stopImmediatePropagation()
		focusNext(dir)(ref.current)
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
