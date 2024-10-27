export type TreeOf<T, C extends string> = T & {
	[key in C]: TreeOf<T, C>[]
}

export const listToTree =
	<T, S extends string>(
		idProp: keyof T & string,
		parentProp: keyof T & string,
		childProp: S
	) =>
	(list: T[]): TreeOf<T, S> =>
		list
			.filter(item => !item[parentProp])
			.map(function buildTree(node: T): any {
				return {
					...node,
					[childProp]: list
						.filter(child => child[parentProp] === node[idProp])
						.map(buildTree)
				}
			})
			.shift()
