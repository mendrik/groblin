import { EditorType } from '@shared/enums'
import { boolean } from 'zod'
import { asField } from '../../zod-form/utils'

export const required = asField(boolean().default(false), {
	label: 'Required',
	editor: EditorType.Switch,
	span: 2
})

export const columnHead = asField(boolean().default(false), {
	label: 'Column',
	editor: EditorType.Switch
})
