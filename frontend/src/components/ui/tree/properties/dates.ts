import { EditorType } from '@shared/enums'
import { dateSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'
import { metas } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const DateProps = dateSettingsSchema.safeExtend({
	relative: dateSettingsSchema.shape.relative.register(metas, {
		label: 'Relative',
		editor: EditorType.Switch,
		span: 2
	}),
	hideColumnHead,
	required
})

export type DateProps = TypeOf<typeof DateProps>
