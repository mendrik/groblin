import { T, assoc, map } from 'ramda'
import {
	isArray,
	isFunction,
	isNotUndefined,
	isPlainObj,
	isUndefined
} from 'ramda-adjunct'
import { caseOf, match } from './match'

export type TransformFn<Prop, Source> =
	| ((prop: Prop) => any)
	| ((source: Source) => any)

export type SpecOrFn<Prop, Source extends object> = Prop extends (infer Item)[]
	? Item extends object
		? Spec<Item> | TransformFn<Prop, Source>
		: TransformFn<Prop, Source>
	: Prop extends object
		? Spec<Prop> | TransformFn<Prop, Source>
		: TransformFn<Prop, Source>

export type Spec<T extends object> = {
	[K: string]: any
}

type ResultOfSpecOrFn<Sp, Prop, S extends object> = Sp extends (
	...args: any[]
) => any
	? Sp extends (p: Prop) => infer R1
		? R1
		: Sp extends (source: S) => infer R2
			? R2
			: never
	: Sp extends Spec<any>
		? Prop extends Array<infer Item>
			? Item extends object
				? Sp extends Spec<Item>
					? Array<EvolveResult<Item, Sp>>
					: never
				: never
			: Prop extends object
				? Sp extends Spec<Prop>
					? EvolveResult<Prop, Sp>
					: never
				: never
		: never

export type EvolveResult<S extends object, Sp extends Spec<S>> = Omit<
	S,
	keyof Sp
> & {
	[K in keyof Sp]: K extends keyof S
		? ResultOfSpecOrFn<Sp[K], S[K], S>
		: Sp[K] extends (source: S) => infer R
			? R
			: never
}

export function evolveAlt<O extends object, Sp extends Spec<O>>(
	specs: Sp,
	source: O
): EvolveResult<O, Sp>

export function evolveAlt<O extends object, Sp extends Spec<O>>(
	specs: Sp
): <R extends EvolveResult<O, Sp>>(source: O) => R

export function evolveAlt(specs: any, source?: any): any {
	if (source === undefined) {
		return (obj: any) => evolveAlt(specs, obj)
	} else {
		const fork = match<[any, any], any>(
			caseOf([isArray, isPlainObj], (prop, spec) =>
				map(evolveAlt(spec as any), prop)
			),
			caseOf([isPlainObj, isPlainObj], (obj, spec) =>
				evolveAlt(spec as any, obj)
			),
			caseOf([isNotUndefined, isFunction], (prop, fn) => fn(prop)),
			caseOf([isUndefined, isFunction], (_, fn) => fn(source)),
			caseOf([T, T], (prop, _) => prop)
		)
		return Object.entries(specs).reduce(
			(acc: any, [key, spec]: [string, any]) =>
				assoc(key, fork(acc[key], spec), acc),
			source ?? {}
		)
	}
}
