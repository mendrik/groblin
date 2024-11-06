import type { Key } from 'ts-key-enum'

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (event: KeyboardEvent) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
}

import type React from 'react'
import { type MutableRefObject, forwardRef, useEffect, useRef } from 'react'

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
}

const KeyListener = forwardRef<HTMLDivElement, KeyListenerProps>(
	({ children, ...handlers }, forwardRef) => {
		const innerRef = useRef<HTMLDivElement>(null)
		const ref = (forwardRef || innerRef) as MutableRefObject<HTMLDivElement>

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
