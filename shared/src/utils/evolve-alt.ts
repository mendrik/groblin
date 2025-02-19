import { T, assoc, map } from 'ramda'
import {
	isArray,
	isFunction,
	isNotUndefined,
	isPlainObj,
	isUndefined
} from 'ramda-adjunct'
import { caseOf, match } from './match.ts'

type Recurse<Source, Spec> = Spec extends (source: any) => infer R
	? R
	: Spec extends object
		? EvolveResult<Source, Spec>
		: never

export type EvolveResult<Source, Spec> = Omit<Source, keyof Spec> & {
	[K in keyof Spec]: K extends keyof Source
		? Source[K] extends Array<infer Item>
			? Item extends object
				? Array<EvolveResult<Item, Spec[K]>>
				: Recurse<Source[K], Spec[K]>
			: Recurse<Source[K], Spec[K]>
		: Recurse<Source, Spec[K]>
}

export function evolveAlt<O extends object, Sp extends object>(
	specs: Sp,
	source: O
): EvolveResult<O, Sp>

export function evolveAlt<O extends object, Sp extends object>(
	specs: Sp
): <R extends EvolveResult<O, Sp>>(source: O) => R

export function evolveAlt(specs: any, source?: any): any {
	if (source === undefined) {
		return (obj: any) => evolveAlt(specs, obj)
	} else {
		const fork = match<[any, any], any>(
			caseOf([isArray, isPlainObj], (prop: any[], spec: object) =>
				map(evolveAlt(spec), prop)
			),
			caseOf([isPlainObj, isPlainObj], (obj: object, spec: object) =>
				evolveAlt(spec, obj)
			),
			caseOf([isNotUndefined, isFunction], (prop: any, fn: Function) =>
				fn(prop)
			),
			caseOf([isUndefined, isFunction], (_, fn: Function) => fn(source)),
			caseOf([T, T], (prop, _) => prop)
		)
		return Object.entries(specs).reduce(
			(acc: any, [key, spec]: [string, any]) =>
				assoc(key, fork(acc[key], spec), acc),
			source ?? {}
		)
	}
}
