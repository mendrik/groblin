import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { NodeType } from '@/gql/graphql'
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
import { caseOf, match } from '@shared/utils/match'
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
const $dialogOpen = signal(false)
const $position = signal<NodeCreatePosition>('child')
export const openNodeCreate = (node: TreeNode, pos: NodeCreatePosition) => {
	setSignal($node, node)
	setSignal($position, pos)
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

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
	caseOf(['root-child'], 'as a root child'),
	caseOf(['child'], 'as a child'),
	caseOf(['sibling-above'], 'as a sibling above'),
	caseOf(['sibling-below'], 'as a sibling below')
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
		parent_id: () => parent($position.value),
		order: () => order($position.value)
	}),
	openParent,
	insertNode
)

export const NodeCreate = () => {
	const [formApi, ref] = useFormState<NewNodeSchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Create node {position($position.value)}</DialogTitle>
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
