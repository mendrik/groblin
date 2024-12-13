import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object } from 'zod'
import { asField } from '../../zod-form/utils'

export const ListProps = object({
	excessive: asField(boolean().default(false), {
		label: 'Excessive',
		editor: EditorType.Switch,
		span: 2,
		description:
			'For lists with many items. Enables pagination, preview, search and imports.'
	})
})

export type ListProps = TypeOf<typeof ListProps>
