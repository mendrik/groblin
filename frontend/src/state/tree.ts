import { computed, signal } from '@preact/signals-react'
import { assertExists } from '@shared/asserts'
import { caseOf, listToTree, match, type TreeOf } from 'matchblade'
import { Maybe } from 'purify-ts'
import {
	T as _,
	aperture,
	toString as asStr,
	find,
	head,
	isNil,
	last,
	lensProp,
	type NonEmptyArray,
	over,
	pipe,
	prop,
	reverse,
	type Tuple,
	unless
} from 'ramda'
import { z } from 'zod'
import type { ChangeNodeInput } from '@/gql/graphql'
import { DeletionKind } from '@/gql/graphql'
import { type InsertNode, type Node, NodeType } from '@/gql/graphql.ts'
import { Api, Subscribe } from '@/gql-client'
import { getItem, setItem } from '@/lib/local-storage'
import { computeSignal, notNil } from '@/lib/signals'
import { requireManage } from './access'
import { requestDeletion } from './deletion'
import { createSaveQueue } from './save-queue'

/** ---- types ---- **/
export type TreeNode = TreeOf<Node, 'nodes'>

type NodeState = {
	open: boolean
	selected: boolean
}

type NodeId = number

/** ---- state ---- **/
export const $nodes = signal<Node[]>([])
export const $nodesMap = computed<Record<NodeId, TreeNode>>(() => {
	const res = {} as Record<NodeId, TreeNode>
	for (const node of $root.value ? iterateNodes($root.value) : []) {
		res[node.id] = node
	}
	return res
})
export const $root = computeSignal($nodes, (nodes: Node[]) =>
	listToTree('id', 'parent_id', 'nodes')(nodes as Node[])
)
export const $nodeStates = signal<Record<string, NodeState>>(
	getItem('tree-state', {})
)

export const $previousNode = signal<number>()
export const $focusedNode = signal<number>()
export const $nextNode = signal<number>()
export const $parentNode = signal<number>()
export const $editingNode = signal<number | undefined>()
const $abort = signal<AbortController>()
let nodesGeneration = 0
export const stopNodesSubscription = () => {
	nodesGeneration++
	$abort.peek()?.abort()
}

/** ---- subscriptions ---- **/
export const subscribeToNodes = () => {
	stopNodesSubscription()
	const generation = nodesGeneration
	$abort.value = Subscribe.NodesUpdated({}, async () => {
		const nodes = await Api.GetNodes()
		if (generation === nodesGeneration) $nodes.value = nodes
	})
}

$root.subscribe(
	unless(isNil, node => {
		updateNodeState({ open: true })(node.id)
	})
)
$nodeStates.subscribe(setItem('tree-state'))

/** ---- interfaces ---- **/
export const $editingBase = signal<Node>()
export const startEditing = (nodeId: number) => {
	requireManage()
	$editingBase.value = asNode(nodeId)
	$editingNode.value = nodeId
}
export const notEditing = () => $editingNode.value === undefined
export const isOpen = (nodeId: number): boolean =>
	$nodeStates.value[`${nodeId}`]?.open
export const stopEditing = () => ($editingNode.value = undefined)

/**
 * Many node operations require access to surrounding nodes of the
 * currently focused one. For example deleting a node needs to focus
 * the previous node after the operation. Instead of cluttering the
 * code with these look-ups, we keep the node "context" armed at all
 * times.
 * @param nodeId
 * @returns same as input so we can tap through this function
 */
export const updateNodeContext = (nodeId: number): number => {
	assertExists($root.value, 'Root node is missing')
	const openNodes = [
		...iterateOpenNodes($root.value)
	] as NonEmptyArray<TreeNode>
	if (openNodes.length === 0) return $root.value.id

	const clampedList = [last(openNodes), ...openNodes, head(openNodes)].map(
		node => node.id
	)

	const findFocused = pipe(
		aperture(3) as (a: number[]) => Tuple<number, 3>[],
		find(([_p, curr, _n]) => curr === nodeId)
	)
	const res = findFocused(clampedList)
	if (res != null) {
		const [prev, focused, next] = res
		$previousNode.value = prev
		$focusedNode.value = focused
		$nextNode.value = next
		$parentNode.value = parentOf(focused)
	}
	return nodeId
}

/**
 * Technically this is the last known focused node, not necessarily
 * the element that is currently focused. This is because the focus
 * transfers to dialogs or dropdowns, but we still want to know
 * where the focus has been.
 */
export const focusedNode = (): number => {
	assertExists($focusedNode.value, 'Focused node is missing')
	return $focusedNode.value
}

export const asNode = (nodeId: number): TreeNode => {
	const res = notNil($nodesMap, nodeId)
	assertExists(res, `Node with id ${nodeId} not found`)
	return res
}

export const previousNode = (): number => {
	assertExists($previousNode.value, 'Previous node is missing')
	return $previousNode.value
}

export const nextNode = (): number => {
	assertExists($nextNode.value, 'Next node is missing')
	return $nextNode.value
}

export const parentNode = (): number => {
	assertExists($parentNode.value, 'Parent node is missing')
	return $parentNode.value
}

export const focusNode = (nodeId: number): number => {
	const node = document.getElementById(`node-${nodeId}`)
	assertExists(node, `Node with id ${nodeId} not found`)
	setTimeout(() => node.focus(), 40)
	return nodeId
}

export const updateNodeState =
	(state: Partial<NodeState>) => (nodeId: number) => {
		$nodeStates.value = over(
			lensProp(asStr(nodeId)),
			(previous: NodeState) => ({ ...previous, ...state }),
			$nodeStates.value
		)
		updateNodeContext(nodeId)
	}

export const nodeState = (state: Partial<NodeState>) =>
	Maybe.fromNullable($focusedNode.value).ifJust(updateNodeState(state))

export const openNode = updateNodeState({ open: true })

export const closeNode = updateNodeState({ open: false })

export const openParent = <T extends Pick<TreeNode, 'parent_id'>>(
	obj: T
): T => {
	if (obj.parent_id) openNode(obj.parent_id)
	return obj
}

const nodeInput = z.strictObject({
	id: z.int().positive(),
	name: z.string(),
	expectedRevision: z.int().nonnegative(),
	order: z.int().nullish(),
	parent_id: z.int().positive().nullish(),
	type: z.enum(NodeType).nullish()
}) satisfies z.ZodType<ChangeNodeInput>
export const nodeSaves = createSaveQueue<ChangeNodeInput, Node>({
	input: nodeInput,
	canRecreate: false,
	storage: window.localStorage,
	key: data => String(data.id),
	send: data => Api.UpdateNode({ data }),
	read: async data => (await Api.GetNodes()).find(node => node.id === data.id),
	onSaved: saved => {
		$nodes.value = $nodes
			.peek()
			.map(node => (node.id === saved.id ? saved : node))
	}
})
const renameInput = (value: string): ChangeNodeInput => {
	requireManage()
	const base = $editingBase.peek()
	assertExists(base, 'No field is being renamed')
	return { id: base.id, name: value, expectedRevision: base.revision }
}
export const stageNodeName = (value: string) =>
	nodeSaves.stage(renameInput(value), 'Field name')
export const confirmNodeName = (value: string) =>
	nodeSaves.save(renameInput(value), 'Field name')

export const deleteNode = (id: number) => {
	requireManage()
	return requestDeletion({ kind: DeletionKind.Node, id }, expectedImpact =>
		Api.DeleteNodeById({
			expectedImpact,
			id,
			parent_id: parentOf(id),
			order: asNode(id).order
		})
	)
}

const defaultSettings = match<[InsertNode], any>(
	caseOf([{ type: NodeType.List }], { scoped: true }),
	caseOf([_], undefined)
)

export const insertNode = (data: InsertNode): Promise<number> => {
	requireManage()
	assertExists(data.parent_id, 'insertNode needs a valid node_id')
	assertExists(data.order, 'insertNode needs a valid order')
	return Api.InsertNode({
		data,
		settings: defaultSettings(data)
	}).then(prop('id'))
}

function* iterateNodes(root: TreeNode): Generator<TreeNode> {
	yield root
	for (const child of root.nodes) {
		yield* iterateNodes(child)
	}
}

export function* iterateOpenNodes(root: TreeNode): Generator<TreeNode> {
	if (root.id !== notNil($root, 'id')) {
		yield root
	}
	if ($nodeStates.value[root.id]?.open === true) {
		for (const child of root.nodes) {
			yield* iterateOpenNodes(child)
		}
	}
}

export function* pathFrom(
	target: TreeNode
): Generator<TreeNode, void, unknown> {
	yield target
	if (target.parent_id != null) {
		yield* pathFrom(asNode(target.parent_id)) // Recursively yield the parent's path
	}
}

export const pathTo = (target: TreeNode): TreeNode[] =>
	reverse([...pathFrom(target)])

export const parentInTree = (
	tree: TreeNode,
	node_id: number | undefined
): number => {
	for (const node of iterateNodes(tree)) {
		if (node.nodes.some(n => n.id === node_id)) return node.id
	}
	throw new Error(`Parent for node id ${node_id} not found`)
}

export const $openNodes = computed((): TreeNode[] => {
	if (!$root.value) return []
	return [...iterateOpenNodes($root.value)]
})

export const parentOf = (node_id: number | undefined): number => {
	assertExists(node_id, 'parentOf needs a valid node_id')
	assertExists($root.value, 'Root node is missing')
	return parentInTree($root.value, node_id)
}
