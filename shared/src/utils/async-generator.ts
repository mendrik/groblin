export const toArray = async <T>(gen: AsyncGenerator<T>): Promise<T[]> => {
	const result = []
	for await (const value of gen) {
		result.push(value)
	}
	return result
}
