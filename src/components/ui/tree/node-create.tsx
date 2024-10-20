import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import type { Node_Insert_Input } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { evolveAlt } from '@/lib/evolve-alt'
import { caseOf, match } from '@/lib/match'
import { pipeAsync } from '@/lib/pipe-async'
import { setSignal } from '@/lib/utils'
import {
	asNode,
	focusNode,
	focusedNode,
	insertNode,
	openNode,
	parentNode,
	refocus,
	updateCurrentNode,
	waitForUpdate
} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { F, T, equals as eq, pipe, tap } from 'ramda'
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

const parent = match<[NodeCreatePosition], number>(
	caseOf([eq('child')], focusedNode),
	caseOf([eq('sibling-above')], () => parentNode()),
	caseOf([eq('sibling-below')], () => parentNode())
)

const order = match<[NodeCreatePosition], number>(
	caseOf(
		[eq('child')],
		pipe(focusedNode, asNode, n => n.nodes.length)
	),
	caseOf(
		[eq('sibling-above')],
		pipe(focusedNode, asNode, n => n.order)
	),
	caseOf(
		[eq('sibling-below')],
		pipe(focusedNode, asNode, n => n.order + 1)
	)
)

const createNode: (data: Partial<Node_Insert_Input>) => void = pipeAsync(
	evolveAlt({
		node_id: () => parent($createNodePosition.value),
		order: () => order($createNodePosition.value)
	}),
	tap(({ node_id }) => openNode(node_id)),
	insertNode,
	updateCurrentNode,
	waitForUpdate,
	focusNode
)

export const NodeCreate = () => {
	return (
		<Dialog open={$createDialogOpen.value}>
			<DialogContent
				className="border-muted-foreground"
				onEscapeKeyDown={pipe(close, refocus)}
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
				<ZodForm
					schema={newNodeSchema}
					columns={2}
					onSubmit={pipe(createNode, close)}
				>
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
