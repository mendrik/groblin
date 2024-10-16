import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { stopPropagation } from '@/lib/dom-events'
import { setSignal } from '@/lib/utils'
import {} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { F, T, pipe } from 'ramda'
import { nativeEnum, strictObject, string } from 'zod'
import { Button } from '../button'
import { asField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'
import { EditorType, NodeType } from './types'

type NodeCreatePosition = 'child' | 'sibling-above' | 'sibling-below'

export const $createDialogOpen = signal(false)
export const $createNodePosition = signal<NodeCreatePosition>('child')
export const openNodeCreate = pipe(
	setSignal($createNodePosition),
	pipe(T, setSignal($createDialogOpen))
)
const close = pipe(F, setSignal($createDialogOpen))

const newNodeSchema = strictObject({
	type: nativeEnum(NodeType).describe(
		asField({
			label: 'Type',
			description: 'The type of node you want to create.',
			editor: EditorType.select
		})
	),
	name: string().describe(
		asField({
			label: 'Name',
			editor: EditorType.input
		})
	)
})

export const NodeCreate = () => (
	<Dialog open={$createDialogOpen.value}>
		<DialogContent
			className="border-muted-foreground"
			onEscapeKeyDown={close}
			onKeyDown={stopPropagation}
			onInteractOutside={close}
		>
			<DialogHeader>
				<DialogTitle>Create node</DialogTitle>
				<DialogDescription>
					Please select the type of node you want to add to the tree at the
					specified location.
				</DialogDescription>
			</DialogHeader>
			<ZodForm schema={newNodeSchema} />
			<DialogFooter>
				<Button onClick={close} variant="secondary">
					Cancel
				</Button>
				<Button type="submit">Create</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)
