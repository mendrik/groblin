import type { ForwardedRef, MutableRefObject } from 'react'

import 'react'

declare module 'react' {
	interface CSSProperties {
		[key: `--${string}`]: string | number
	}
}

export const isActiveRef = <EL>(
	ref: ForwardedRef<EL>
): ref is MutableRefObject<EL> =>
	ref != null && 'current' in ref && ref.current != null
