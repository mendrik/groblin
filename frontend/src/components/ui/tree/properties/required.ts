import { EditorType } from '@shared/enums'
import { boolean } from 'zod'
import { asField } from '../../zod-form/utils'

export const required = asField(boolean().default(false), {
	label: 'Required',
	editor: EditorType.Switch
})
