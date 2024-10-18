import { mergeAll } from 'ramda'
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form'
import type { AnyZodObject, ZodType } from 'zod'
import * as z from 'zod'
import type { ZodFormField } from '../tree/types'
export const asField = (meta: ZodFormField): string => JSON.stringify(meta)

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
		checkType instanceof type || innerType(checkType) instanceof type

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
	if (schema instanceof z.ZodNullable) {
		return innerType(schema.unwrap()) as UnwrapZod<T>
	} else if (schema instanceof z.ZodDefault) {
		return innerType(schema.removeDefault()) as UnwrapZod<T>
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
