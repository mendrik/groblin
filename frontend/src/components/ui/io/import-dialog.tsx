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
import type { TreeNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, pipe } from 'ramda'
import { type TypeOf, boolean, instanceof as isA, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField, stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

const $node = signal<TreeNode>()
const $dialogOpen = signal(false)
export const openImportJson = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

const importJsonSchema = () =>
	strictObject({
		data: asField(isA(File), {
			label: 'Json file',
			editor: EditorType.File,
			description: 'Select the json file to import'
		}),
		externalId: stringField(
			'External ID',
			EditorType.Input,
			'off',
			'External ID of the node'
		),
		structure: asField(boolean().default(true), {
			label: 'Structure',
			editor: EditorType.Switch,
			description: 'Create missing structure'
		})
	})

export type ImportJsonSchema = TypeOf<ReturnType<typeof importJsonSchema>>

const importCommand: (data: ImportJsonSchema) => Promise<boolean> = pipeAsync(
	() => console.log('Importing JSON'),
	() => true
)

export const ImportDialog = () => {
	const [formApi, ref] = useFormState<ImportJsonSchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>
						Import JSON to <strong>{$node.value?.name}</strong>
					</DialogTitle>
					<DialogDescription>
						Objects can import only objects and lists can import only arrays.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={importJsonSchema()}
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
