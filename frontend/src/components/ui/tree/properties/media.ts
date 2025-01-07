import { EditorType } from '@shared/enums'
import { type TypeOf, array, object, string } from 'zod'
import { asField } from '../../zod-form/utils'
import { hideColumnHead, required } from './common'

export const MediaProps = object({
	thumbnails: asField(
		array(
			string().regex(/^\d+(x\d+)?$/, {
				message: 'Must be a number or dimensions (e.g. 50x50)'
			})
		).default([]),
		{
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
