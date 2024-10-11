import { computed } from '@preact/signals'
import { useState } from 'preact/hooks'
import { fromPairs, isNotEmpty, prop } from 'ramda'
import {
	ControlledTreeEnvironment,
	Tree,
	type TreeItem,
	type TreeItemIndex
} from 'react-complex-tree'
import 'react-complex-tree/lib/style-modern.css'
import { $root, type TreeNode } from '../../state/tree'

function* flattenTree(
	node: TreeNode
): Generator<[TreeItemIndex, TreeItem<TreeNode>]> {
	const { id, nodes } = node

	// Yield the current node
	yield [
		id,
		{
			index: id,
			children: nodes.map(prop('id')),
			isFolder: isNotEmpty(nodes),
			canMove: true,
			canRename: true,
			data: node
		}
	]

	// Recursively yield all child nodes
	for (const childNode of nodes) {
		yield* flattenTree(childNode)
	}
}

const nodeDictionary = computed<Record<TreeItemIndex, TreeItem<TreeNode>>>(
	() => ($root.value ? fromPairs([...flattenTree($root.value)]) : {})
)

nodeDictionary.subscribe(console.log)

export const DocumentTree = () => {
	const [focusedItem, setFocusedItem] = useState<TreeItemIndex>()
	const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([])
	const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([])

	return (
		<div class="w-full h-full rct-dark">
			<ControlledTreeEnvironment<TreeNode>
				items={nodeDictionary.value}
				getItemTitle={item => item.data.name}
				canDragAndDrop
				canRename
				canReorderItems
				viewState={{
					doc: { focusedItem, expandedItems, selectedItems }
				}}
				onFocusItem={item => setFocusedItem(item.index)}
				onExpandItem={item => setExpandedItems([...expandedItems, item.index])}
				onCollapseItem={item =>
					setExpandedItems(
						expandedItems.filter(
							expandedItemIndex => expandedItemIndex !== item.index
						)
					)
				}
				onSelectItems={items => setSelectedItems(items)}
			>
				<Tree treeId="doc" rootItem="1" />
			</ControlledTreeEnvironment>
		</div>
	)
}
