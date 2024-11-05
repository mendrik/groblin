import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import type { Tag } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/utils'
import { $tags, updateTag } from '@/state/tag'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { T, equals, pipe, reject } from 'ramda'
import { type TypeOf, number, object } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField, stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

export const $editedTag = signal<Tag>()
export const $editDialogOpen = signal(false)
export const openTagEdit = pipe(
	setSignal($editedTag),
	T,
	setSignal($editDialogOpen)
)

const close = () => setSignal($editDialogOpen, false)

// not static because $tags change
const editTagSchema = () =>
	object({
		name: stringField('Name', EditorType.Input, 'off', 'Name of the tag'),
		parent_id: asField(number().optional(), {
			label: 'Parent',
			placeholder: 'No parent',
			description: 'From which tag should values be inherited from?',
			editor: EditorType.Select,
			options: pipe(notNil, reject(equals($editedTag.value)))($tags)
		})
	})

export type EditTagSchema = TypeOf<ReturnType<typeof editTagSchema>>

const updateTagCommand: (data: EditTagSchema) => Promise<boolean> = pipe(
	evolveAlt({ id: () => notNil($editedTag).id }),
	updateTag
)

export const TagEdit = () => {
	const [formApi, ref] = useFormState<EditTagSchema>()
	return (
		<Dialog open={$editDialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Edit tag</DialogTitle>
					<DialogDescription>Please configure the your tag.</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={editTagSchema()}
					onSubmit={pipe(updateTagCommand, close)}
					onError={console.error}
					defaultValues={$editedTag.value}
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
