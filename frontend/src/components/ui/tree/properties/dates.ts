import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object } from 'zod'
import { asField } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const DateProps = object({
	relative: asField(boolean().default(false), {
		label: 'Relative',
		editor: EditorType.Switch,
		span: 2
	}),
	columnHead: hideColumnHead,
	required
})

export type DateProps = TypeOf<typeof DateProps>
