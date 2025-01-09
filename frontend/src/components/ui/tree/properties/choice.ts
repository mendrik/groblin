import { EditorType } from '@shared/enums'
import { type TypeOf, array, object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const ChoiceProps = object({
	choices: asField(array(string().nonempty()).default([]), {
		label: 'Choices',
		description: 'Enter a list of choices',
		span: 2,
		editor: EditorType.Tags
	}),
	hideColumnHead,
	required
})

export type ChoiceProps = TypeOf<typeof ChoiceProps>
