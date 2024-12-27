import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { saveValue } from '@/state/value'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { mergeLeft, objOf, omit, pipe } from 'ramda'
import { type TypeOf, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'
import type { ListItemValue } from './list-editor'

export const $editListItemOpen = signal(false)
export const $item = signal<ListItemValue>()

export const openListItemEdit = (item: ListItemValue) => {
	setSignal($item, item)
	setSignal($editListItemOpen, true)
}
const close = () => setSignal($editListItemOpen, false)

const editListItemSchema = strictObject({
	name: stringField('Name', EditorType.Input, 'off', 'New item')
})

export type NewListItemSchema = TypeOf<typeof editListItemSchema>

const createListItemCommand: (data: NewListItemSchema) => Promise<number> =
	pipeAsync(
		objOf('value'),
		n => mergeLeft(n, notNil($item)),
		omit(['order']),
		saveValue
	)

export const ListItemEdit = () => {
	const [formApi, ref] = useFormState<NewListItemSchema>()
	return (
		<Dialog open={$editListItemOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Rename item</DialogTitle>
				</DialogHeader>
				<ZodForm
					schema={editListItemSchema}
					columns={1}
					onSubmit={pipe(createListItemCommand, close)}
					defaultValues={{
						name: $item.value?.value.name
					}}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Save
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
