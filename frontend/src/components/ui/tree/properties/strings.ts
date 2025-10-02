import { type TypeOf, object } from 'zod/v4'
import { hideColumnHead, required } from './common'

export const StringProps = object({
	hideColumnHead,
	required
})

export type StringProps = TypeOf<typeof StringProps>
