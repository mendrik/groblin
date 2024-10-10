type TreeOf<T, C extends string = 'children'> = Omit<T, C> &
	Record<C, TreeOf<T>[]>

export const listToTree =
	<T>(
		idProp: keyof T & string,
		parentProp: keyof T & string,
		childProp: string
	) =>
	(list: T[]): TreeOf<T, typeof childProp> =>
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
