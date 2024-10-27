import type { ForwardedRef, MutableRefObject } from 'react'

export const isActiveRef = <EL>(
	ref: ForwardedRef<EL>
): ref is MutableRefObject<EL> =>
	ref != null && 'current' in ref && ref.current != null
