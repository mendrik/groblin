import { hasMethod } from '@/lib/utils'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import KeyListener from './key-listener'

type OwnProps = PropsWithChildren<{
	horizontal?: boolean
	vertical?: boolean
	focusableSelector?: string
}>

enum Direction {
	Right = 0,
	Left = 1,
	Up = 2,
	Down = 3
}

const defaultFocusable =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const focusFirst = (focusableSelector: string) => (el: HTMLElement | null) => {
	const focusable = el?.querySelector(focusableSelector)
	if (hasMethod(focusable, 'focus')) {
		setTimeout(() => focusable.focus(), 40)
	}
}

const FocusTravel = ({
	horizontal,
	vertical,
	focusableSelector = defaultFocusable,
	children
}: OwnProps) => {
	const ref = useRef<HTMLDivElement>(null)

	const focus = (dir: Direction) => (ev: Event) => {
		console.log(ref.current)
	}

	useEffect(() => focusFirst(focusableSelector)(ref.current))

	return (
		<KeyListener
			onArrowDown={focus(Direction.Down)}
			onArrowUp={focus(Direction.Up)}
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
