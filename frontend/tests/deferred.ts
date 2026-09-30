/** A controllable network response without timers or ES2024-only type declarations. */
export function deferred<T>() {
	let controls:
		| {
				resolve: (value: T | PromiseLike<T>) => void
				reject: (reason?: unknown) => void
		  }
		| undefined
	const promise = new Promise<T>((resolve, reject) => {
		controls = { resolve, reject }
	})
	if (!controls) throw new Error('Promise executor did not initialize')
	return { promise, ...controls }
}
