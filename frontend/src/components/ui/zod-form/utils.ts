import type { EditorType } from '@shared/enums'
import { isNotEmpty, mergeAll, pipe, trim } from 'ramda'
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form'
import { type AnyZodObject, type ZodType, type ZodTypeDef, string } from 'zod'
import * as z from 'zod'
import type { FieldMeta } from './types'

type ZodTypeEnhanced<
	O = any,
	D extends ZodTypeDef = ZodTypeDef,
	I = O
> = ZodType<O, D, I> & {
	meta: FieldMeta
	original: ZodType<O, D, I>
}

export const isEnhanced = <O, D extends ZodTypeDef, I>(
	type: any
): type is ZodTypeEnhanced<O, D, I> =>
	type._def !== undefined && type.meta !== undefined

// Create a proxy to delegate method calls
export const asField = <
	M extends FieldMeta,
	O = any,
	D extends ZodTypeDef = ZodTypeDef,
	I = O
>(
	schema: ZodType<O, D, I>,
	meta: M
): ZodTypeEnhanced<O, D, I> => {
	return new Proxy(schema, {
		get(target: any, prop: string) {
			if (prop === 'meta') {
				return meta
			}
			if (prop === 'original') {
				return schema
			}
			if (typeof target[prop] === 'function') {
				return (...args: any[]) => target[prop](...args)
			}
			return target[prop]
		}
	})
}

export const objectHandler = (
	zodRef: AnyZodObject
): Record<string, z.ZodTypeAny> =>
	Object.keys(zodRef.shape).reduce(
		(carry, key) => {
			const res = generateDefaults<z.ZodTypeAny>(zodRef.shape[key])
			return {
				...carry,
				...(res !== undefined ? { [key]: res } : {})
			}
		},
		{} as Record<string, z.ZodTypeAny>
	)

export const generateDefaults = <T extends z.ZodTypeAny>(
	zodRef: T
): z.infer<T> => {
	if (zodRef instanceof z.ZodObject) {
		return objectHandler(zodRef)
	} else if (zodRef instanceof z.ZodDefault) {
		return zodRef._def.defaultValue()
	} else if (zodRef instanceof z.ZodUnion) {
		return mergeAll(zodRef._def.options.map(generateDefaults))
	}
	return undefined
}

export type IsZodType<T extends ZodType<any, any>> = T extends ZodType<
	infer U,
	any
>
	? U
	: never

export const isZodType =
	<T extends ZodType<any, any>>(type: new (...args: any[]) => T) =>
	(checkType: ZodType<any, any>): checkType is T =>
		innerType(checkType) instanceof type

// Type-level unwrapping
type UnwrapZod<T extends z.ZodTypeAny> = T extends z.ZodNullable<infer U>
	? UnwrapZod<U>
	: T extends z.ZodDefault<infer U>
		? UnwrapZod<U>
		: T extends z.ZodOptional<infer U>
			? UnwrapZod<U>
			: T extends z.ZodEffects<infer U>
				? UnwrapZod<U>
				: T // Extend as needed

// Runtime function
export function innerType<T extends z.ZodTypeAny>(schema: T): UnwrapZod<T> {
	if (isEnhanced(schema)) {
		return innerType(schema.original) as UnwrapZod<T>
	} else if (schema instanceof z.ZodDefault) {
		return innerType(schema.removeDefault()) as UnwrapZod<T>
	} else if (schema instanceof z.ZodNullable) {
		return innerType(schema.unwrap()) as UnwrapZod<T>
	} else if (schema instanceof z.ZodOptional) {
		return innerType(schema.unwrap()) as UnwrapZod<T>
	} else if (schema instanceof z.ZodEffects) {
		return innerType(schema._def.schema) as UnwrapZod<T>
	} else {
		return schema as UnwrapZod<T>
	}
}

export type RendererProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = Parameters<ControllerProps<TFieldValues, TName>['render']>[0]

export const stringField = (
	label: string,
	editor: EditorType,
	autofill?: string,
	placeholder?: string
) =>
	asField(
		string()
			.refine(pipe(trim, isNotEmpty), { message: `${label} is required` })
			.default(''),
		{ label, editor, autofill, placeholder }
	)

export const enumToMap = <T extends Record<string, string>>(enumRef: T) =>
	Object.entries(enumRef)
