import { computed } from '@preact/signals'
import { useState } from 'preact/hooks'
import { fromPairs, isNotEmpty, prop } from 'ramda'
import {
	ControlledTreeEnvironment,
	type TreeItem,
	type TreeItemIndex
} from 'react-complex-tree'
import 'react-complex-tree/lib/style-modern.css'
import './app.css'
import { DocumentTree } from './components/app/document-tree'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'
import { ScrollArea } from './components/ui/scroll-area'
import { $root, type TreeNode } from './state/tree'

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

export function App() {
	const [focusedItem, setFocusedItem] = useState<TreeItemIndex>()
	const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([])
	const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([])

	return (
		<ControlledTreeEnvironment<TreeNode>
			items={nodeDictionary.value}
			getItemTitle={item => item.data.name}
			canDragAndDrop
			canRename
			canReorderItems
			viewState={{
				documentTree: { focusedItem, expandedItems, selectedItems }
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
			<ResizablePanelGroup direction="horizontal" className="w-full">
				<ResizablePanel defaultSize={25}>
					<ScrollArea className="w-full p-2 pl-0 pr-1">
						<DocumentTree />
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={75} />
			</ResizablePanelGroup>
		</ControlledTreeEnvironment>
	)
}
