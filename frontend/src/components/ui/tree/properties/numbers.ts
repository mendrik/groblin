import { EditorType } from '@shared/enums'
import { boolean, object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { required } from './required'

export const NumberProps = object({
	mask: asField(string().optional(), {
		label: 'Input Mask',
		editor: EditorType.Input,
		span: 2
	}),
	integers: asField(boolean().default(false), {
		label: 'Integers',
		editor: EditorType.Switch
	}),
	required
})
