import { useEvent } from 'react-use'
import type { Key } from 'ts-key-enum'

type KeyHandlers = {
	[K in `on${Capitalize<keyof typeof Key>}`]?: (event: KeyboardEvent) => void
}

interface KeyListenerProps extends KeyHandlers {
	children?: React.ReactNode
}

const KeyListener = ({ children, ...handlers }: KeyListenerProps) => {
	useEvent('keydown', (event: KeyboardEvent) => {
		const handlerName = `on${event.key}` as keyof KeyHandlers

		if (handlerName in handlers) {
			handlers[handlerName]?.(event)
		}
	})

	return children || null
}

export default KeyListener
