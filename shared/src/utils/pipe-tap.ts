type Param<T extends (args: any) => any> = T extends (args: infer P) => any
	? P
	: never

type PF = (args: any) => any

type PP<F extends PF> = (arg: Param<F>, r: Awaited<ReturnType<F>>) => any

type HasPromise<T extends any[]> = T extends [infer First, ...infer Rest]
	? First extends Promise<any>
		? 1
		: HasPromise<Rest>
	: 0

export function pipeTap<F0 extends PF>(
	fn1: F0
): (
	arg: Param<F0>
) => HasPromise<[ReturnType<F0>]> extends 1
	? Promise<Awaited<ReturnType<F0>>>
	: ReturnType<F0>

export function pipeTap<F0 extends PF, F1 extends PP<F0>>(
	fn1: F0,
	fn2: F1
): (
	arg: Param<F0>
) => HasPromise<[ReturnType<F0>, ReturnType<F1>]> extends 1
	? Promise<Awaited<ReturnType<F1>>>
	: ReturnType<F1>

export function pipeTap<F0 extends PF, F1 extends PP<F0>>(
	fn1: F0,
	fn2: F1
): (
	arg: Param<F0>
) => HasPromise<[ReturnType<F0>, ReturnType<F1>]> extends 1
	? Promise<Awaited<ReturnType<F1>>>
	: ReturnType<F1>

export function pipeTap<F extends Array<PF>>(
	fn1: F[0],
	fn2?: F[1],
	fn3?: F[2],
	fn4?: F[3],
	fn5?: F[4],
	fn6?: F[5],
	fn7?: F[6]
): any {
	const functions = [fn1, fn2, fn3, fn4, fn5, fn6, fn7].filter(
		Boolean
	) as Array<(...args: any[]) => any>

	return (...args: any[]) =>
		functions.reduce(
			(result: any, currentFn) =>
				// Use Promise.resolve to handle async functions properly
				Promise.resolve(result).then(resolvedResult =>
					currentFn(args, resolvedResult)
				),
			fn1(args) // Initialize with the result of the first function
		)
}
