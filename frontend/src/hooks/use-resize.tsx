import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

type UseResizeReturn = {
	width: number
	height: number
}

const useResize = (
	ref: React.RefObject<HTMLElement | null>
): UseResizeReturn => {
	console.log(ref.current)

	const [size, setSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0
	})

	const handleResize = useCallback(() => {
		if (ref.current) {
			const rect = ref.current.getBoundingClientRect()

			setSize({
				width: rect.width,
				height: rect.height
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

	useLayoutEffect(() => {
		handleResize()
	}, [handleResize])

	return size
}

export default useResize
