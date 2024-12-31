import { useCallback, useEffect, useState } from 'react'

type UseResizeReturn = {
	width: number
	height: number
}

const useResize = (
	ref: React.RefObject<HTMLElement | null>
): UseResizeReturn => {
	const [size, setSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0
	})

	const handleResize = useCallback(() => {
		if (ref.current) {
			setSize({
				width: ref.current.offsetWidth,
				height: ref.current.offsetHeight
			})
		}
	}, [ref])

	useEffect(() => {
		const resizeObserver = new ResizeObserver(handleResize)

		if (ref.current) {
			resizeObserver.observe(ref.current)
			handleResize() // Initial call to set the size
		}

		return () => {
			if (ref.current) {
				resizeObserver.unobserve(ref.current)
			}
		}
	}, [ref, handleResize])

	return size
}

export default useResize
