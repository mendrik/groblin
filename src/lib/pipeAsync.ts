type Awaited<T> = T extends PromiseLike<infer U> ? U : T

type AsyncFn<I, O> = (input: I) => O | Promise<O>

export function pipeAsync<A, B>(
	fn1: AsyncFn<A, B>
): (input: A) => Promise<Awaited<B>>

export function pipeAsync<A, B, C>(
	fn1: AsyncFn<A, B>,
	fn2: AsyncFn<Awaited<B>, C>
): (input: A) => Promise<Awaited<C>>

export function pipeAsync<A, B, C, D>(
	fn1: AsyncFn<A, B>,
	fn2: AsyncFn<Awaited<B>, C>,
	fn3: AsyncFn<Awaited<C>, D>
): (input: A) => Promise<Awaited<D>>

export function pipeAsync<A, B, C, D, E>(
	fn1: AsyncFn<A, B>,
	fn2: AsyncFn<Awaited<B>, C>,
	fn3: AsyncFn<Awaited<C>, D>,
	fn4: AsyncFn<Awaited<D>, E>
): (input: A) => Promise<Awaited<E>>

export function pipeAsync<A, B, C, D, E, F>(
	fn1: AsyncFn<A, B>,
	fn2: AsyncFn<Awaited<B>, C>,
	fn3: AsyncFn<Awaited<C>, D>,
	fn4: AsyncFn<Awaited<D>, E>,
	fn5: AsyncFn<Awaited<E>, F>
): (input: A) => Promise<Awaited<F>>

export function pipeAsync(
	...fns: Array<(arg: any) => any>
): (input: any) => Promise<any> {
	return (input: any) =>
		fns.reduce(
			(promiseChain, currentFunction) =>
				promiseChain.then(res => currentFunction(res)),
			Promise.resolve(input)
		)
}
