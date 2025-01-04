import type { Key } from 'ts-key-enum'

import {
	type ReactNode,
	type RefObject,
	type KeyboardEvent as,
	forwardRef,
	useEffect,
	useRef
} from 'react'

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (
		event: KeyboardEvent | React.KeyboardEvent
	) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: ReactNode
}

interface KeyListenerProps extends KeyHandlers {
	children?: ReactNode
}

const KeyListener = forwardRef<HTMLDivElement, KeyListenerProps>(
	({ children, ...handlers }, forwardRef) => {
		const innerRef = useRef<HTMLDivElement>(null)
		const ref = (forwardRef || innerRef) as RefObject<HTMLDivElement>

		useEffect(() => {
			const handleKeyDown = (e: KeyboardEvent) => {
				const handlerName = `on${e.key}` as keyof KeyHandlers
				if (handlerName in handlers) {
					handlers[handlerName]?.(e)
				}
			}
			ref.current?.addEventListener('keydown', handleKeyDown)
			return () => ref.current?.removeEventListener('keydown', handleKeyDown)
		})

		return (
			<div className="contents" ref={ref}>
				{children}
			</div>
		)
	}
)

export default KeyListener
