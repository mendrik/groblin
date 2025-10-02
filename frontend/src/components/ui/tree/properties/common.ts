import { EditorType } from '@shared/enums'
import { boolean } from 'zod/v4'
import {  metas } from '../../zod-form/utils'

export const required = boolean().default(false).register(metas, {
	label: 'Required',
	editor: EditorType.Switch
})

export const hideColumnHead = boolean().default(false).register(metas, {
	label: 'Hide in list view',
	editor: EditorType.Switch
})
