import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import { notNil, setSignal } from '@/lib/utils'
import {
	$root,
	type TreeNode,
	insertNode,
	openParent,
	parentOf
} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { evolveAlt } from '@shared/utils/evolve-alt'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, pipe } from 'ramda'
import { type TypeOf, nativeEnum, strictObject } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { asField, enumToMap, stringField } from '../zod-form/utils'
import { ZodForm } from '../zod-form/zod-form'

type NodeCreatePosition =
	| 'root-child'
	| 'child'
	| 'sibling-above'
	| 'sibling-below'

const $node = signal<TreeNode>()
export const $createDialogOpen = signal(false)
export const $createNodePosition = signal<NodeCreatePosition>('child')
export const openNodeCreate = (node: TreeNode, pos: NodeCreatePosition) => {
	setSignal($node, node)
	setSignal($createNodePosition, pos)
	setSignal($createDialogOpen, true)
}
const close = pipe(F, setSignal($createDialogOpen))

const newNodeSchema = () =>
	strictObject({
		name: stringField('Name', EditorType.Input, 'off', 'Name of the node'),
		type: asField(nativeEnum(NodeType).default(NodeType.Object), {
			label: 'Type',
			description: 'The type of node you want to create.',
			editor: EditorType.Select,
			options: enumToMap(NodeType)
				.filter(([_, v]) => v !== NodeType.Root)
				.sort()
		})
	})

export type NewNodeSchema = TypeOf<ReturnType<typeof newNodeSchema>>

const position = match<[NodeCreatePosition], string>(
	caseOf(['root-child'], _ => 'as a root child'),
	caseOf(['child'], _ => 'as a child'),
	caseOf(['sibling-above'], _ => 'as a sibling above'),
	caseOf(['sibling-below'], _ => 'as a sibling below')
)

const parent = match<[NodeCreatePosition], number>(
	caseOf(['root-child'], () => notNil($root).id),
	caseOf(['child'], () => notNil($node).id),
	caseOf(['sibling-above'], () => parentOf(notNil($node).id)),
	caseOf(['sibling-below'], () => parentOf(notNil($node).id))
)

const order = match<[NodeCreatePosition], number>(
	caseOf(['root-child'], () => 0),
	caseOf(['child'], () => notNil($node).nodes.length),
	caseOf(['sibling-above'], () => notNil($node).order),
	caseOf(['sibling-below'], () => notNil($node).order + 1)
)

const createNodeCommand: (data: NewNodeSchema) => Promise<number> = pipeAsync(
	evolveAlt({
		parent_id: () => parent($createNodePosition.value),
		order: () => order($createNodePosition.value)
	}),
	openParent,
	insertNode
)

export const NodeCreate = () => {
	const [formApi, ref] = useFormState<NewNodeSchema>()

	return (
		<Dialog open={$createDialogOpen.value}>
			<DialogContent close={close}>
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
					schema={newNodeSchema()}
					columns={2}
					onSubmit={pipe(createNodeCommand, close)}
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
