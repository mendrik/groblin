import { EditorType } from '@shared/enums'
import { object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { required } from './required'

export const NumberProps = object({
	unit: asField(string().optional(), {
		label: 'Unit',
		editor: EditorType.Input,
		span: 2
	}),
	required
})
