import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object, string } from 'zod'
import { asField } from '../../zod-form/utils'

export const ListProps = object({
	nameTemplate: asField(string().optional(), {
		label: 'Name Template',
		editor: EditorType.Input,
		span: 2,
		description:
			'You can have auto generated item names based on direct children. Use $<property> to insert the child name property.'
	}),
	excessive: asField(boolean().default(false), {
		label: 'Excessive',
		editor: EditorType.Switch,
		span: 2,
		description:
			'For lists with many items. Enables pagination, preview, search and imports.'
	})
})

export type ListProps = TypeOf<typeof ListProps>
