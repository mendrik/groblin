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
	T extends object,
	K extends keyof T,
	R extends { [RK in keyof T]: string },
	MP extends string
> = Omit<
	{
		[P in MP]: Array<{
			[RP in keyof R]: T[K] extends keyof T ? T[T[K]] : never // Add the `mergeProp` array with renamed keys
		}>
	} & T,
	keyof R
>

export const mergeProps = <
	T extends object,
	K extends keyof T,
	R extends { [RK in keyof T]: string },
	M extends string
>(
	groupByProp: K,
	renameProps: R,
	mergeProp: M,
	obj: T[]
): MergePropsReturnType<T, K, R, M> => {
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
		map(evolveAlt(spec)),
		map(omit(keys)) as AnyFn,
		groupBy(propOr('', groupByProp as string)),
		map(reduce(reducer, {})),
		values
	)(obj) as any
}
