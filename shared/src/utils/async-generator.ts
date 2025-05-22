export const toArray = async <T>(gen: AsyncGenerator<T>): Promise<T[]> => {
	const result: Awaited<T>[] = []
	for await (const value of gen) {
		result.push(value)
	}
	return result
}
