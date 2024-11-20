import type { TreeNode } from '@/state/tree'
import { IconSquareRoundedPlus } from '@tabler/icons-react'
import { range } from 'ramda'
import { Button } from '../button'
import { openListItemCreate } from './list-item-create'

type OwnProps = {
	node: TreeNode
}

export const ListEditor = ({ node }: OwnProps) => {
	return (
		<div className="flex flex-row w-full h-7 -ml-1">
			<Button
				size="icon"
				variant="ghost"
				className="p-1 h-7 w-7 content-center"
				onClick={() => openListItemCreate(node)}
			>
				<IconSquareRoundedPlus
					className="h-5 w-5 shrink-0 text-muted-foreground"
					stroke={1}
				/>
			</Button>
			<ol className="flex flex-row gap-1 items-center">
				{range(0, 5).map(i => (
					<Button
						key={`${i}`}
						size="sm"
						variant="ghost"
						className="py-0 px-2 h-6"
					>
						Item 1
					</Button>
				))}
			</ol>
		</div>
	)
}
