import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { NodeType } from '@/gql/graphql'
import { setSignal } from '@/lib/utils'
import { refocus } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { pipe, tap } from 'ramda'
import { type TypeOf, nativeEnum, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField, enumToMap, stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

export const $settingsDialogOpen = signal(false)

export const openNodeSettings = () => setSignal($settingsDialogOpen, true)
const close = () => setSignal($settingsDialogOpen, false)

const nodeSettingsSchema = () =>
	strictObject({
		name: stringField('Name', EditorType.Input, 'off', 'Name of the node'),
		type: asField(nativeEnum(NodeType).default(NodeType.Object), {
			label: 'Type',
			description: 'The type of node you want to create.',
			editor: EditorType.Select,
			options: enumToMap(NodeType).filter(([_, v]) => v !== NodeType.Root)
		})
	})

export type NodeSettingsSchema = TypeOf<ReturnType<typeof nodeSettingsSchema>>

const saveNodeSettingsCommand: (data: NodeSettingsSchema) => Promise<void> =
	pipeAsync(tap(console.log))

export const NodeProperties = () => {
	const [formApi, ref] = useFormState<NodeSettingsSchema>()
	const dialogClose = pipe(close, refocus)

	return (
		<Dialog open={$settingsDialogOpen.value}>
			<DialogContent close={dialogClose}>
				<DialogHeader>
					<DialogTitle>Node properties</DialogTitle>
					<DialogDescription>
						Please configure how node values will be displayed and edited.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={nodeSettingsSchema()}
					columns={2}
					onSubmit={pipe(saveNodeSettingsCommand, dialogClose)}
					onError={console.error}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Apply
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
