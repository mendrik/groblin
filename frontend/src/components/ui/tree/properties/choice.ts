import { EditorType } from '@shared/enums'
import { choiceSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'
import { metas } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const ChoiceProps = choiceSettingsSchema.safeExtend({
	choices: choiceSettingsSchema.shape.choices.register(metas, {
		label: 'Choices',
		description: 'Enter a list of choices',
		span: 2,
		editor: EditorType.Tags
	}),
	hideColumnHead,
	required
})

export type ChoiceProps = TypeOf<typeof ChoiceProps>
