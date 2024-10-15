import {} from '@/lib/dom-events'
import {} from '@/lib/ramda'
import { cn } from '@/lib/utils'
import { $isEditingNode, $nodes, type TreeNode } from '@/state/tree'
import { always } from 'ramda'
import { useRef } from 'react'
import {} from 'zod'
import { NodeChevron } from './node-chevron'
import { NodeEditor } from './node-editor'
import { NodeOptions } from './node-options'
import { NodeText } from './node-text'

type OwnProps = {
	node: TreeNode
	depth: number
}

export const Node = ({ node, depth }: OwnProps) => {
	const isOpen = $nodes.value[node.id]?.open
	const editor = useRef<HTMLInputElement>(null)
	const textBtn = useRef<HTMLButtonElement>(null)

	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 16 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full gap-1">
					<NodeChevron node={node} />
					{node.id === $isEditingNode.value ? (
						<NodeEditor node={node} ref={editor} textBtn={textBtn} />
					) : (
						<NodeText node={node} ref={textBtn} />
					)}
					<NodeOptions node={node} editor={editor} />
				</div>
				{node.nodes.filter(always(isOpen)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
