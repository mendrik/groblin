import { type RefCallback, useCallback, useState } from 'react'
import type { FormApi } from './zod-form'

export const useFormState = (): [
	FormApi['formState'],
	RefCallback<FormApi>
] => {
	const [state, setState] = useState({ isSubmitting: false })
	const ref = useCallback((api: FormApi | null) => {
		if (api)
			setState(previous =>
				previous.isSubmitting === api.formState.isSubmitting
					? previous
					: api.formState
			)
	}, [])
	return [state, ref]
}
