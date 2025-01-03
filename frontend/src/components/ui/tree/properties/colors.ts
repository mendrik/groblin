import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object } from 'zod'
import { asField } from '../../zod-form/utils'
import { columnHead, required } from './common'

export const ColorProps = object({
	columnHead,
	colorRows: asField(boolean().default(false), {
		label: 'Color rows',
		editor: EditorType.Switch
	}),
	required
})

export type ColorProps = TypeOf<typeof ColorProps>
