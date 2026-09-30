import { basicSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'
import { hideColumnHead, required } from './common'

export const StringProps = basicSettingsSchema.safeExtend({
	hideColumnHead,
	required
})

export type StringProps = TypeOf<typeof StringProps>
