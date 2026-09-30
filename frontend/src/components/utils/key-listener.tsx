import type React from 'react'
import {
	forwardRef,
	type ReactNode,
	type RefObject,
	useEffect,
	useRef
} from 'react'
import type { Key } from 'ts-key-enum'

export type KeyEvent = KeyboardEvent | React.KeyboardEvent

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (event: KeyEvent) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: ReactNode
	className?: string
}

const KeyListener = forwardRef<HTMLDivElement, KeyListenerProps>(
	({ children, className = 'contents', ...handlers }, forwardRef) => {
		const innerRef = useRef<HTMLDivElement>(null)
		const ref = (forwardRef || innerRef) as RefObject<HTMLDivElement>

		useEffect(() => {
			const handleKeyDown = (e: KeyEvent) => {
				const handlerName = `on${e.key}` as keyof KeyHandlers
				if (handlerName in handlers) {
					handlers[handlerName]?.(e)
				}
			}
			ref.current?.addEventListener('keydown', handleKeyDown)
			return () => ref.current?.removeEventListener('keydown', handleKeyDown)
		})

		return (
			<div className={className} ref={ref}>
				{children}
			</div>
		)
	}
)

export default KeyListener
