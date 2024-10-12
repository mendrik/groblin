import { mergeDeepLeft } from 'ramda'
import type { Dispatch } from 'react'
import { useLocalStorage } from 'react-use'
import type { ZodTypeAny } from 'zod'

export const useUpdateLocalStorage = <T extends object>(
	key: string,
	codec: ZodTypeAny,
	value: T
): [NonNullable<T>, Dispatch<Partial<T>>] => {
	const [nodeState, updateNodeState] = useLocalStorage<T>(key, value, {
		raw: false,
		deserializer: codec.parse,
		serializer: JSON.stringify
	})

	return [
		codec.parse(nodeState),
		(newValue: Partial<T>) =>
			updateNodeState(old => mergeDeepLeft<any, any>(old, newValue))
	]
}
