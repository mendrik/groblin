import { mergeAll } from 'ramda'
import * as z from 'zod'
import type { ZodType } from 'zod'
import type { ZodFormField } from '../tree/types'

export const asField = (meta: ZodFormField): string => JSON.stringify(meta)

export const objectHandler = (
	zodRef: z.AnyZodObject
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
): z.infer<typeof zodRef> => {
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

export function isZodType<T extends ZodType<any, any>>(
	type: new (...args: any[]) => T
) {
	return (checkType: ZodType<any, any>): checkType is T => {
		// Check if checkType is an instance of the provided Zod type
		return (
			checkType instanceof type || checkType._def?.innerType instanceof type
		)
	}
}
