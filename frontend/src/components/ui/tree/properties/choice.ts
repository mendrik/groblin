import { EditorType } from '@shared/enums'
import { infer as TypeOf, array, object, string } from 'zod/v4'
import { hideColumnHead, required } from './common'
import { metas } from '../../zod-form/utils'

export const ChoiceProps = object({
	choices: array(string().nonempty()).default([]).register(metas, {
		label: 'Choices',
		description: 'Enter a list of choices',
		span: 2,
		editor: EditorType.Tags
	}),
	hideColumnHead,
	required
})

export type ChoiceProps = TypeOf<typeof ChoiceProps>
