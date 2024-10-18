type Last<Type extends any[]> = Type extends [...any[], infer R] ? R : never

export const pipeTap =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T): ReturnType<Last<FUNCTIONS>> =>
		fns.reduce((_, fn) => fn(arg), undefined) as ReturnType<Last<FUNCTIONS>>

type LastReturnType<Type extends any[]> = Type extends [...any[], infer LAST_FN]
	? LAST_FN extends () => Promise<infer R>
		? Promise<R>
		: LAST_FN extends () => infer R
			? Promise<R>
			: never
	: never

export const pipeTapAsync =
	<T, FUNCTIONS extends Array<(arg: T) => any>>(...fns: FUNCTIONS) =>
	(arg: T) =>
		fns.reduce(
			(pc, fn) => pc.then(() => fn(arg)),
			Promise.resolve()
		) as LastReturnType<FUNCTIONS>

export const pipeAsync =
	<T, FUNCTIONS extends Array<(arg: any) => any>>(...fns: FUNCTIONS) =>
	(arg: T) =>
		fns.reduce(
			(pc, fn) => pc.then(arg => fn(arg)),
			Promise.resolve(arg)
		) as LastReturnType<FUNCTIONS>
