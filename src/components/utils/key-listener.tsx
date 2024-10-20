import { is } from 'ramda'
import { useEvent } from 'react-use'
import type { Key } from 'ts-key-enum'

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (
		event: React.KeyboardEvent
	) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
	container?: React.RefObject<Element>
}

const KeyListener = ({
	children,
	container,
	...handlers
}: KeyListenerProps) => {
	useEvent('keydown', (event: React.KeyboardEvent) => {
		const handlerName = `on${event.key}` as keyof KeyHandlers
		const { current } = container ?? {}
		if (
			((is(HTMLElement, current) && current.contains(event.target as Node)) ||
				!current) &&
			handlerName in handlers
		) {
			handlers[handlerName]?.(event)
		}
	})

	return children || null
}

export default KeyListener
