import { EditorType } from '@shared/enums'
import { mediaSettingsSchema } from '@shared/node-settings'
import type { infer as TypeOf } from 'zod/v4'
import { metas } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const MediaProps = mediaSettingsSchema.safeExtend({
	thumbnails: mediaSettingsSchema.shape.thumbnails.register(metas, {
		label: 'Thumbnails',
		description: 'Either side lengths (300) or dimensions (50x50)',
		span: 2,
		editor: EditorType.Tags
	}),
	hideColumnHead,
	required
})

export type MediaProps = TypeOf<typeof MediaProps>
