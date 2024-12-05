import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {} from '@/lib/match'
import { setSignal } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, pipe } from 'ramda'
import { type TypeOf, instanceof as isA, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

const $node = signal<TreeNode>()
const $dialogOpen = signal(false)
export const openImportJson = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

const importObjectSchema = () =>
	strictObject({
		data: asField(isA(File), {
			label: 'Json file',
			editor: EditorType.File,
			extra: {
				accept: '.json,application/json'
			},
			description: 'Select the json file to import'
		})
	})

export type ImportObjectSchema = TypeOf<ReturnType<typeof importObjectSchema>>

const importCommand: (data: ImportObjectSchema) => Promise<boolean> = pipeAsync(
	() => console.log('Importing JSON'),
	() => true
)

export const ImportObjectDialog = () => {
	const [formApi, ref] = useFormState<ImportObjectSchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>
						Import json object to <strong>{$node.value?.name}</strong>
					</DialogTitle>
				</DialogHeader>
				<ZodForm
					schema={importObjectSchema()}
					columns={2}
					onSubmit={pipe(importCommand, close)}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Import
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
