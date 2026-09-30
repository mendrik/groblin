import { signal } from '@preact/signals-react'
import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { setSignal } from '@/lib/signals'

export const $location = signal<string>(window.location.pathname)

export const RouteObserver = () => {
	const [location] = useLocation()

	useEffect(() => {
		setSignal($location, location)
	}, [location])

	return null
}
