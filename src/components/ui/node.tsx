import { cn } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { IconChevronRight, IconFile, IconFolder } from '@tabler/icons-react'
import { isNotEmpty } from 'ramda'
import { Button } from './button'

type OwnProps = {
	node: TreeNode
	depth: number
}

export const Node = ({ node, depth }: OwnProps) => {
	const hasChildren = isNotEmpty(node.nodes)
	return (
		<ol className={cn(`list-none m-0`)} style={{ paddingLeft: depth * 16 }}>
			<li data-node_id={node.id}>
				<div className="flex flex-row items-center justify-start w-full">
					<Button
						type="button"
						variant="ghost"
						className="flex-0 shrink-0 p-0 w-4 h-auto"
					>
						{hasChildren ? <IconChevronRight className="w-4 h-4" /> : null}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="flex flex-row gap-1 p-0 w-full items-center justify-start h-auto"
					>
						{hasChildren ? (
							<IconFolder className="w-4 h-4" />
						) : (
							<IconFile className="w-4 h-4" />
						)}
						<div>{node.name}</div>
					</Button>
				</div>
				{node.nodes.map(child => (
					<Node node={child} key={child.id} depth={depth + 1} />
				))}
			</li>
		</ol>
	)
}
