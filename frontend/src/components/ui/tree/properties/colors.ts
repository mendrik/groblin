import { type TypeOf, object } from 'zod'
import { hideColumnHead, required } from './common'

export const ColorProps = object({
	hideColumnHead,
	required
})

export type ColorProps = TypeOf<typeof ColorProps>
