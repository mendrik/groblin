import { EditorType } from '@shared/enums'
import { type TypeOf, boolean, object } from 'zod'
import { asField } from '../../zod-form/utils'

export const ListProps = object({
	scoped: asField(boolean().default(false), {
		label: 'Scoped',
		editor: EditorType.Switch,
		span: 2,
		description:
			'Scoped lists add new items only to the current set. Otherwise, items in the list are "global".'
	})
})

export type ListProps = TypeOf<typeof ListProps>
