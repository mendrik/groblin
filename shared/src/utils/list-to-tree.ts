export type TreeOf<T, C extends string> = T & {
	[key in C]: TreeOf<T, C>[]
}

export const listToTree =
	<I extends string, P extends string, S extends string>(
		idProp: I,
		parentProp: P,
		childProp: S
	) =>
	<
		ID extends string | number,
		T extends { [i in I]: ID } & {
			[p in P]?: ID | undefined | null
		}
	>(
		list: T[]
	): TreeOf<T, S> =>
		list
			.filter(item => !item[parentProp])
			.map(function buildTree(node: any): any {
				return {
					...node,
					[childProp]: list
						.filter(child => child[parentProp] === node[idProp])
						.map(buildTree)
				}
			})
			.shift()
