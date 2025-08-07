import { EditorType } from '@shared/enums'
import { type TypeOf, number, object, string } from 'zod/v4'
import { hideColumnHead, required } from './common'
import { metas } from '../../zod-form/utils'

export const NumberProps = object({
	unit: string().optional().register(metas, {
		label: 'Unit',
		editor: EditorType.Input,
		span: 2
	}),
	precision: number().default(0).register(metas, {
		label: 'Precision',
		editor: EditorType.Number,
		span: 2,
		extra: {
			scale: 0,
			min: 0,
			max: 5
		}
	}),
	minimum: number().optional().register(metas, {
		label: 'Minimum',
		editor: EditorType.Number,
		extra: {
			scale: 2
		}
	}),
	maximum: number().optional().register(metas, {
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
