import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import type { Tag } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import {} from '@/lib/match'
import { notNil, setSignal } from '@/lib/utils'
import { $tags, updateTag } from '@/state/tag'
import { signal } from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import { EditorType } from '@shared/enums'
import { type NonEmptyArray, T, pipe } from 'ramda'
import { type TypeOf, enum as enumZ, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField, nonEmptyString } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

export const $editedTag = signal<Tag>()
export const $editDialogOpen = signal(false)
export const openTagEdit = pipe(
	setSignal($editedTag),
	T,
	setSignal($editDialogOpen)
)

const close = () => setSignal($editDialogOpen, false)

const editTagSchema = strictObject({
	name: nonEmptyString('Name', EditorType.Input).default('New tag'),
	parent_id: enumZ($tags.value.map(t => t.name) as NonEmptyArray<string>)
		.describe(
			asField({
				label: 'Parent',
				description: 'From which tag should values be inherited from?',
				editor: EditorType.Select
			})
		)
		.transform(value => {
			const tagId = notNil($tags).find(t => t.name === value)?.id
			assertExists(tagId, 'Tag not found')
			return tagId
		})
		.optional()
})

export type EditTagSchema = TypeOf<typeof editTagSchema>
const updateTagCommand = (data: EditTagSchema): Promise<boolean> =>
	updateTag({
		...data,
		id: notNil($editedTag).id
	})

export const TagEdit = () => {
	const [formApi, ref] = useFormState<EditTagSchema>()
	return (
		<Dialog open={$editDialogOpen.value}>
			<DialogContent
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
				<DialogHeader>
					<DialogTitle>Edit tag</DialogTitle>
					<DialogDescription>Please configure the your tag.</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={editTagSchema}
					columns={1}
					onSubmit={pipe(updateTagCommand, close)}
					onError={console.error}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Update
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
