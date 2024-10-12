import { cn } from '@/lib/utils'
import { $nodes, type TreeNode, updateNodeState } from '@/state/tree'
import {
	IconChevronDown,
	IconChevronRight,
	IconFile,
	IconFolder
} from '@tabler/icons-react'
import { always, isNotEmpty } from 'ramda'
import {} from 'zod'
import { Button } from './button'

type OwnProps = {
	node: TreeNode
	depth: number
}

export const Node = ({ node, depth }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	const isOpen = $nodes.value[node.id]?.open
	return (
		<ol
			className={cn(`list-none m-0 pt-1`)}
			style={{ paddingLeft: depth * 16 }}
		>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full">
					{hasChildren ? (
						<Button
							type="button"
							variant="ghost"
							className="flex-0 shrink-0 p-0 w-4 h-auto"
							tabIndex={-1}
						>
							{isOpen ? (
								<IconChevronDown
									className="w-4 h-4"
									onClick={() => updateNodeState(node, { open: false })}
								/>
							) : (
								<IconChevronRight
									className="w-4 h-4"
									onClick={() => updateNodeState(node, { open: true })}
								/>
							)}
						</Button>
					) : (
						<div className="flex-0 shrink-0 w-4" />
					)}
					<Button
						type="button"
						variant="ghost"
						className="flex flex-row gap-1 px-1 py-0 w-full items-center justify-start h-auto"
						data-node_id={node.id}
					>
						{hasChildren ? (
							<IconFolder className="w-4 h-4 shrink-0" />
						) : (
							<IconFile className="w-4 h-4 shrink-0" />
						)}
						<div className="p-1">{node.name}</div>
					</Button>
				</div>
				{node.nodes.filter(always(isOpen)).map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
