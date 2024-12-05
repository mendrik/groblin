import { EditorType } from '@shared/enums'
import { type TypeOf, number, object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { required } from './required'

export const NumberProps = object({
	unit: asField(string().optional(), {
		label: 'Unit',
		editor: EditorType.Input,
		span: 2
	}),
	precision: asField(number().default(0), {
		label: 'Precision',
		editor: EditorType.Number,
		span: 2
	}),
	required
})

export type NumberProps = TypeOf<typeof NumberProps>
