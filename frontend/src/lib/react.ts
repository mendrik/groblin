import type { ForwardedRef, RefCallback, RefObject } from 'react'

import 'react'

declare module 'react' {
	interface CSSProperties {
		[key: `--${string}`]: string | number
	}
}

export const isActiveRef = <EL>(ref: ForwardedRef<EL>): ref is RefObject<EL> =>
	ref != null && 'current' in ref && ref.current != null

type MutableRefList<T> = Array<RefCallback<T> | RefObject<T> | undefined | null>

export function mergeRefs<T>(...refs: MutableRefList<T>): RefCallback<T> {
	return (val: T) => {
		setRef(val, ...refs)
	}
}

function setRef<T>(val: T, ...refs: MutableRefList<T>): void {
	refs.forEach(ref => {
		if (typeof ref === 'function') {
			ref(val)
		} else if (ref != null) {
			ref.current = val
		}
	})
}
