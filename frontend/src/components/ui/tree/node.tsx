import { cn } from '@/lib/utils'
import { $editingNode, type TreeNode, isOpen } from '@/state/tree'
import { always } from 'ramda'
import { useRef } from 'react'
import { NodeChevron } from './node-chevron'
import { NodeEditor } from './node-editor'
import { NodeOptions } from './node-options'
import { NodeText } from './node-text'

type OwnProps = {
	node: TreeNode
	depth: number
}

export const Node = ({ node, depth }: OwnProps) => {
	const open = isOpen(node.id)
	const editor = useRef<HTMLInputElement>(null)
	const textBtn = useRef<HTMLButtonElement>(null)

	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 8 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full gap-1">
					<NodeChevron node={node} />
					{node.id === $editingNode.value ? (
						<NodeEditor node={node} ref={editor} textBtn={textBtn} />
					) : (
						<NodeText node={node} ref={textBtn} />
					)}
					<NodeOptions node={node} editor={editor} />
				</div>
				{node.nodes.filter(always(open)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
