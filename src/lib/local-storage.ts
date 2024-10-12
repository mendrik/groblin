import { tryCatch } from 'ramda'

export const setItem =
	(key: string) =>
	<T>(value: T) =>
		localStorage.setItem(key, JSON.stringify(value))

const safeParse = tryCatch(JSON.parse, console.error)

export const getItem = <T>(key: string): T | undefined => {
	const item = localStorage.getItem(key)
	return item ? safeParse(item) : undefined
}
