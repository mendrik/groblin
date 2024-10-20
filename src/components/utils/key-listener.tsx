import type { Key } from 'ts-key-enum'

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (event: KeyboardEvent) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
}

import type React from 'react'
import { useEffect, useRef } from 'react'

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
}

const KeyListener = ({ children, ...handlers }: KeyListenerProps) => {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const handlerName = `on${e.key}` as keyof KeyHandlers
			if (handlerName in handlers) {
				handlers[handlerName]?.(e)
			}
		}

		const currentRef = ref.current
		if (currentRef) {
			currentRef.addEventListener('keydown', handleKeyDown)
		}

		return () => {
			if (currentRef) {
				currentRef.removeEventListener('keydown', handleKeyDown)
			}
		}
	})

	return (
		<div className="contents" ref={ref}>
			{children || null}
		</div>
	)
}

export default KeyListener
