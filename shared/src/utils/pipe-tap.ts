export const pipeTap =
	<A extends Array<(arg: Parameters<A[0]>[0]) => any>>(...fns: A) =>
	(
		arg: Parameters<A[0]>[0]
	): ReturnType<A extends [...infer Rest, infer LAST] ? LAST : never> =>
		fns.reduce((_, fn) => fn(arg), undefined) as ReturnType<
			A extends [...infer Rest, infer LAST] ? LAST : never
		>
