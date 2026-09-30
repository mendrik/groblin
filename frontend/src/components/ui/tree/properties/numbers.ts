import { EditorType } from '@shared/enums'
import { numberSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'
import { metas } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const NumberProps = numberSettingsSchema.safeExtend({
	unit: numberSettingsSchema.shape.unit.register(metas, {
		label: 'Unit',
		editor: EditorType.Input,
		span: 2
	}),
	precision: numberSettingsSchema.shape.precision.register(metas, {
		label: 'Precision',
		editor: EditorType.Number,
		span: 2,
		extra: {
			scale: 0,
			min: 0,
			max: 12
		}
	}),
	minimum: numberSettingsSchema.shape.minimum.register(metas, {
		label: 'Minimum',
		editor: EditorType.Number,
		extra: {
			scale: 2
		}
	}),
	maximum: numberSettingsSchema.shape.maximum.register(metas, {
		label: 'Maximum',
		editor: EditorType.Number,
		extra: {
			scale: 0
		}
	}),
	hideColumnHead,
	required
})

export type NumberProps = TypeOf<typeof NumberProps>
