import { type RefObject, useMemo, useRef } from 'react'
import type { FieldValues, FormState } from 'react-hook-form'
import type { FormApi } from './zod-form'

export const useFormState = <T extends FieldValues>(): [
	FormState<T>,
	RefObject<FormApi<T> | null>
] => {
	const ref = useRef<FormApi<T>>(null)

	const state = useMemo(
		() =>
			new Proxy(ref, {
				get(target, prop: keyof FormState<T>) {
					return target.current?.formState?.[prop]
				}
			}) as unknown as FormState<T>,
		[]
	)

	return [state, ref] as const
}
