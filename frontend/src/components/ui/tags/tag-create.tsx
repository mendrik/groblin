import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { stopPropagation } from '@/lib/dom-events'
import {} from '@/lib/match'
import { setSignal } from '@/lib/utils'
import { insertTag, selectTag } from '@/state/tag'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'
import { useRef } from 'react'
import { type TypeOf, strictObject, string } from 'zod'
import { Button } from '../button'
import { asField } from '../zod-form/utils'
import { type FormApi, ZodForm } from '../zod-form/zod-form'

export const $createDialogOpen = signal(false)
export const openTagCreate = pipe(T, setSignal($createDialogOpen))
const close = pipe(F, setSignal($createDialogOpen))

const newTagSchema = strictObject({
	name: string()
		.describe(
			asField({
				label: 'Name',
				editor: EditorType.Input,
				autofill: 'off'
			})
		)
		.min(1)
		.default('New node')
})

export type NewTagSchema = TypeOf<typeof newTagSchema>

const createTagCommand: (data: NewTagSchema) => Promise<void> = pipeAsync(
	insertTag,
	selectTag
)

export const TagCreate = () => {
	const formApi = useRef<FormApi<NewTagSchema>>(null)
	return (
		<Dialog open={$createDialogOpen.value}>
			<DialogContent
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
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
					ref={formApi}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={formApi.current?.formState.isSubmitting}
						>
							Create
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
