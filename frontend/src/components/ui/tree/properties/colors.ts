import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object } from 'zod'
import { asField } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const ColorProps = object({
	colorRows: asField(boolean().default(false), {
		label: 'Color rows',
		editor: EditorType.Switch,
		span: 2
	}),
	hideColumnHead,
	required
})

export type ColorProps = TypeOf<typeof ColorProps>
