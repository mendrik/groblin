import { tryCatch } from 'ramda'

export const setItem =
	(key: string) =>
	<T>(value: T) =>
		void setTimeout(() => {
			localStorage.setItem(key, JSON.stringify(value))
		}, 20)

const safeParse = tryCatch(JSON.parse, console.error)

export const getItem = <T>(
	key: string,
	initial?: T | undefined
): typeof initial extends undefined ? T | undefined : T => {
	const item = localStorage.getItem(key)
	return item ? safeParse(item) : initial
}

export const removeItems = (...keys: string[]) =>
	keys.forEach(key => localStorage.removeItem(key))
