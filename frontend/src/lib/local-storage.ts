import { forEach, tryCatch } from 'ramda'

const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const setItemAsync =
	(key: string) =>
	<T>(value: T): void => {
		const existingTimeout = timeouts.get(key)
		if (existingTimeout) {
			clearTimeout(existingTimeout)
		}
		const timeoutId = setTimeout(() => {
			localStorage.setItem(key, JSON.stringify(value))
			timeouts.delete(key) // Clean up the map after the timeout has completed
		}, 200)
		timeouts.set(key, timeoutId)
	}

export const setItem =
	(key: string) =>
	<T>(value: T) =>
		localStorage.setItem(key, JSON.stringify(value))

const safeParse = tryCatch(JSON.parse, console.error)

export const getItem = <T>(
	key: string,
	initial?: T | undefined
): typeof initial extends undefined ? T | undefined : T => {
	if (timeouts.has(key)) {
		console.warn('getItem called while setItemAsync is still pending')
	}
	const item = localStorage.getItem(key)
	return item ? safeParse(item) : initial as T
}

const removeItem = localStorage.removeItem.bind(localStorage)

export const removeItems = forEach<string>(removeItem)
