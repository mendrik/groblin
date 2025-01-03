import { type TypeOf, object } from 'zod'
import { hideColumnHead, required } from './common'

export const StringProps = object({
	hideColumnHead,
	required
})

export type StringProps = TypeOf<typeof StringProps>
