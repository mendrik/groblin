export function pipeTapAsync<A extends Array<(arg: any) => any>>(
	...fns: A
): (
	input: Parameters<A[0]>[0]
) => A extends [...any, infer LAST]
	? LAST extends (arg: any) => infer R
		? R extends Promise<infer P>
			? P
			: R
		: never
	: never {
	return arg =>
		fns.reduce((pc, fn) => pc.then(() => fn(arg)), Promise.resolve()) as any
}
