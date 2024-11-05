import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {} from '@/lib/match'
import { setSignal } from '@/lib/utils'
import { insertTag, selectTag } from '@/state/tag'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { pipe } from 'ramda'
import { type TypeOf, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

export const $createDialogOpen = signal(false)
export const openTagCreate = () => setSignal($createDialogOpen, true)
const close = () => setSignal($createDialogOpen, false)

const newTagSchema = strictObject({
	name: stringField('Name', EditorType.Input).default('New tag')
})

export type NewTagSchema = TypeOf<typeof newTagSchema>

const createTagCommand: (data: NewTagSchema) => Promise<void> = pipeAsync(
	insertTag,
	selectTag
)

export const TagCreate = () => {
	const [formApi, ref] = useFormState<NewTagSchema>()
	return (
		<Dialog open={$createDialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Create tag</DialogTitle>
					<DialogDescription>
						Please enter the name of the tag you want to create.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={newTagSchema}
					columns={1}
					onSubmit={pipe(createTagCommand, close)}
					onError={console.error}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
