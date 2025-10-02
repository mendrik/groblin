import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { type TreeNode, importArray } from '@/state/tree'
import { activePath } from '@/state/value'
import { signal } from '@preact/signals-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { EditorType } from '@shared/enums'
import { evolveAlt } from 'matchblade'
import { pipeAsync } from 'matchblade'
import { F, pipe } from 'ramda'
import { isArray } from 'ramda-adjunct'
import { toast } from 'sonner'
import { infer as TypeOf, boolean, strictObject, string } from 'zod/v4'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import {  fileUpload, metas } from '../zod-form/utils'
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
		data: fileUpload(
			'Json file',
			'.json,application/json',
			'Select the json file to import'
		),
		external_id: string().optional().register(metas, {
			label: 'External ID',
			editor: EditorType.Input,
			description: 'External ID of each item'
		}),
		structure: boolean().default(true).register(metas, {
			label: 'Structure',
			editor: EditorType.Switch,
			description: 'Create missing structure'
		})
	})

export type ImportArraySchema = TypeOf<ReturnType<typeof importArraySchema>>

const importCommand: (data: ImportArraySchema) => Promise<unknown> = pipeAsync(
	evolveAlt({
		node_id: () => notNil($node, 'id'),
		list_path: () => activePath(notNil($node))
	}),
	importArray,
	close
)

const failed = (e: Error | string[]) =>
	toast.error('Failed to import data', {
		description: isArray(e) ? e.join(', ') : e.message,
		closeButton: true
	})

export const ImportArrayDialog = () => {
	const [formApi, ref] = useFormState<ImportArraySchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>
						Import array data to <strong>{$node.value?.name}</strong>
					</DialogTitle>
					<VisuallyHidden>
						<DialogDescription>Import json data</DialogDescription>
					</VisuallyHidden>
				</DialogHeader>
				<ZodForm
					schema={importArraySchema()}
					columns={2}
					onSubmit={importCommand}
					onError={failed}
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
