import { EditorType } from '@shared/enums'
import { type TypeOf, number, object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const NumberProps = object({
	unit: asField(string().optional(), {
		label: 'Unit',
		editor: EditorType.Input,
		span: 2
	}),
	precision: asField(number().default(0), {
		label: 'Precision',
		editor: EditorType.Number,
		span: 2,
		extra: {
			scale: 0,
			min: 0,
			max: 5
		}
	}),
	minimum: asField(number().optional(), {
		label: 'Minimum',
		editor: EditorType.Number,
		extra: {
			scale: 2
		}
	}),
	maximum: asField(number().optional(), {
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
