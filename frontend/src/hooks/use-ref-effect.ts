import { type MutableRefObject, useEffect, useRef } from 'react'

function useRefEffect<T extends HTMLElement>(
	callback: (current: T) => any
): [MutableRefObject<T | null>, ReturnType<typeof callback>] {
	const ref = useRef<T | null>(null)
	const res = useRef(null)

	useEffect(() => {
		if (ref.current !== null) {
			res.current = callback(ref.current)
		}
	})

	return [ref, res.current]
}

export default useRefEffect
