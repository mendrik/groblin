import { EditorType } from '@shared/enums'
import { commonSettings } from '@shared/node-settings'
import { metas } from '../../zod-form/utils'

export const required = commonSettings.required.register(metas, {
	label: 'Required',
	editor: EditorType.Switch
})

export const hideColumnHead = commonSettings.hideColumnHead.register(metas, {
	label: 'Hide in list view',
	editor: EditorType.Switch
})
