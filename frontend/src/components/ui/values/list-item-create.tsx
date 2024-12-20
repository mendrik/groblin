import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { notNil, setSignal } from '@/lib/utils'
import { type TreeNode } from '@/state/tree'
import { focusListItem, insertListItem, listPath } from '@/state/value'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipeAsync } from '@shared/utils/pipe-async'
import { pipe } from 'ramda'
import { type TypeOf, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

export const $createListItemOpen = signal(false)
export const $node = signal<TreeNode>()
export const openListItemCreate = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($createListItemOpen, true)
}
const close = () => setSignal($createListItemOpen, false)

const newListItemSchema = strictObject({
	name: stringField('Name', EditorType.Input, 'off', 'New item')
})

export type NewListItemSchema = TypeOf<typeof newListItemSchema>

const createListItemCommand: (data: NewListItemSchema) => Promise<void> =
	pipeAsync(
		evolveAlt({
			node_id: () => notNil($node, 'id'),
			list_path: () => listPath(notNil($node))?.slice(0, -1)
		}),
		insertListItem,
		focusListItem
	)

export const ListItemCreate = () => {
	const [formApi, ref] = useFormState<NewListItemSchema>()
	return (
		<Dialog open={$createListItemOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Add item</DialogTitle>
					<DialogDescription>
						Please enter the name of new item
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={newListItemSchema}
					columns={1}
					onSubmit={pipe(createListItemCommand, close)}
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
