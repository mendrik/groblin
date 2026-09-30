import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { EditorType } from '@shared/enums'
import { strictObject, type TypeOf } from 'zod/v4'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { notNil, setSignal } from '@/lib/signals'
import { saveValue } from '@/state/value'
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

const createListItemCommand = (value: NewListItemSchema) => {
	const item = notNil($item)
	return saveValue({
		expectedRevision: item.revision,
		id: item.id,
		node_id: item.node_id,
		list_path: item.list_path,
		value
	})
}

export const ListItemEdit = () => {
	const [formApi, ref] = useFormState()
	return (
		<Dialog open={$editListItemOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Rename item</DialogTitle>
					<VisuallyHidden>
						<DialogDescription>Rename the item</DialogDescription>
					</VisuallyHidden>
				</DialogHeader>
				<ZodForm
					schema={editListItemSchema}
					columns={1}
					onSubmit={async value => {
						await createListItemCommand(value)
						close()
					}}
					defaultValues={{
						name: $item.value?.value.name
					}}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button type="button" onClick={close} variant="secondary">
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
