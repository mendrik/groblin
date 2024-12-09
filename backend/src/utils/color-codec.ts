import chroma from 'chroma-js'
import { tryCatch } from 'ramda'
import { isError, isString } from 'ramda-adjunct'
import { NEVER, z } from 'zod'

// Union of all color formats
export const color = z.string().transform((value, { addIssue }) => {
	const res = tryCatch(v => chroma(v).rgba(), Error)(value)
	if (
		isError(res) ||
		isString(res) ||
		res.some(Number.isNaN) ||
		res.some(n => n < 0 || n > 255)
	) {
		addIssue({ message: 'Invalid color', code: z.ZodIssueCode.custom })
		return NEVER
	}
	return res
})
