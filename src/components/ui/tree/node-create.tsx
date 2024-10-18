import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { stopPropagation } from '@/lib/dom-events'
import { caseOf, match } from '@/lib/match'
import { assertExists, setSignal } from '@/lib/utils'
import { $focusedNode, insertNode, parentOf } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { F, T, equals as eq, nthArg, pipe } from 'ramda'
import { type TypeOf, nativeEnum, strictObject, string } from 'zod'
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
	name: string()
		.describe(
			asField({
				label: 'Name',
				editor: EditorType.input,
				autofill: 'off'
			})
		)
		.default('New node'),
	type: nativeEnum(NodeType)
		.describe(
			asField({
				label: 'Type',
				description: 'The type of node you want to create.',
				editor: EditorType.select
			})
		)
		.default(NodeType.object)
})

export type NewNodeSchema = TypeOf<typeof newNodeSchema>

const position = match<[NodeCreatePosition], string>(
	caseOf([eq('child')], _ => 'as a child'),
	caseOf([eq('sibling-above')], _ => 'as a sibling above'),
	caseOf([eq('sibling-below')], _ => 'as a sibling below')
)

const parent = match<[NodeCreatePosition, number], number>(
	caseOf([eq('child'), T], nthArg(1)),
	caseOf([eq('sibling-above'), T], pipe(nthArg(1), parentOf)),
	caseOf([eq('sibling-below'), T], pipe(nthArg(1), parentOf)),
	caseOf([T, T], console.error as any)
)

export const NodeCreate = () => {
	const submit = (data: NewNodeSchema) => {
		assertExists($focusedNode.value, 'No focused node to create under')
		assertExists($createNodePosition.value, 'No position to create node')
		const node_id = parent($createNodePosition.value, $focusedNode.value)
		assertExists(node_id, `Failed to locate node parent for insert: ${node_id}`)
		return insertNode({
			...data,
			node_id,
			order: 0
		})
	}

	return (
		<Dialog open={$createDialogOpen.value}>
			<DialogContent
				className="border-muted-foreground"
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
				<DialogHeader>
					<DialogTitle>
						Create node {position($createNodePosition.value)}
					</DialogTitle>
					<DialogDescription>
						Please select the type of node you want to add to the tree at the
						specified location.
					</DialogDescription>
				</DialogHeader>
				<ZodForm schema={newNodeSchema} columns={2} onSubmit={submit}>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit">Create</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
