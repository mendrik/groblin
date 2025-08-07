import { EditorType } from '@shared/enums'
import { infer as TypeOf, array, object, string } from 'zod/v4'
import { hideColumnHead, required } from './common'

export const MediaProps = object({
	thumbnails: 
		array(
			string().regex(/^\d+(x\d+)?$/, {
				message: 'Must be a number or dimensions (e.g. 50x50)'
			})
		).default([]).register(metas, {
			label: 'Thumbnails',
			description: 'Either side lengths (300) or dimensions (50x50)',
			span: 2,
			editor: EditorType.Tags
		}
	),
	hideColumnHead,
	required
})

export type MediaProps = TypeOf<typeof MediaProps>
