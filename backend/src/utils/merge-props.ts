import { evolveAlt } from '@shared/utils/evolve-alt.ts'
import type { AnyFn } from '@tp/functions.ts'
import {
	concat,
	groupBy,
	map,
	mergeWithKey,
	omit,
	pickAll,
	pipe,
	propOr,
	reduce,
	values
} from 'ramda'
import { ensureArray, renameKeys } from 'ramda-adjunct'

type MergePropsReturnType<
	T extends { [s: string]: any },
	R extends { [RK: string]: string },
	MP extends string
> = Omit<T, keyof R> & {
	[P in MP]: Array<{
		[RP in keyof R as R[RP]]: RP extends keyof T ? T[RP] : never
	}>
}

export const mergeProps = <
	T extends { [s: string]: any },
	R extends { [RK: string]: string },
	GP extends keyof T,
	MP extends string
>(
	groupByProp: GP,
	renameProps: R,
	mergeProp: MP,
	obj: T[]
): MergePropsReturnType<T, R, MP>[] => {
	const keys = Object.keys(renameProps)
	const reducer = mergeWithKey((k, a, b) =>
		k === mergeProp ? concat(a, b) : a
	)
	const spec = {
		[mergeProp]: pipe(
			pickAll(keys),
			renameKeys(renameProps as any),
			ensureArray
		)
	}
	return pipe(
		map(evolveAlt<any, any>(spec)),
		map(omit(keys)) as AnyFn,
		groupBy(propOr('', groupByProp as string)),
		map(reduce(reducer, {})),
		values
	)(obj) as any
}
