import { EditorType } from '@shared/enums'
import { infer as  TypeOf, boolean, object } from 'zod/v4'
import { hideColumnHead, required } from './common'
import { metas } from '../../zod-form/utils'

export const DateProps = object({
	relative: boolean().default(false).register(metas, {
		label: 'Relative',
		editor: EditorType.Switch,
		span: 2
	}),
	hideColumnHead,
	required
})

export type DateProps = TypeOf<typeof DateProps>
