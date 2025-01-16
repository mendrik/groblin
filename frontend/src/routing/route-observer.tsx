import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { useEffect } from 'react'
import { useLocation } from 'wouter'

export const $location = signal<string>(window.location.pathname)

export const RouteObserver = () => {
	const [location] = useLocation()

	useEffect(() => {
		setSignal($location, location)
	}, [location])

	return null
}
