import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { notNil, setSignal } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'
import { type TypeOf, any, boolean, strictObject } from 'zod'
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

const importArraySchema = () =>
	strictObject({
		data: asField(any(), {
			label: 'Json file',
			editor: EditorType.File,
			extra: {
				accept: '.json,application/json'
			},
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

export type ImportArraySchema = TypeOf<ReturnType<typeof importArraySchema>>

const importCommand: (data: ImportArraySchema) => Promise<boolean> = pipeAsync(
	evolveAlt({
		node_id: () => notNil($node, 'id')
	}),
	T
)

export const ImportArrayDialog = () => {
	const [formApi, ref] = useFormState<ImportArraySchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>
						Import array data to <strong>{$node.value?.name}</strong>
					</DialogTitle>
				</DialogHeader>
				<ZodForm
					schema={importArraySchema()}
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
