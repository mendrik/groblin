import { notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $valueMap } from '@/state/value'
import {
	type Icon,
	IconSquareRoundedMinus,
	IconSquareRoundedPlus
} from '@tabler/icons-react'
import { Button } from '../button'
import { openListItemCreate } from './list-item-create'

type ListButtonProps = {
	onClick: () => void
	icon: Icon
}

const ListButton = ({ onClick, icon: Icon }: ListButtonProps) => (
	<Button
		size="icon"
		variant="ghost"
		className="p-1 h-5 w-5 content-center"
		onClick={onClick}
	>
		<Icon className="h-4 w-4 shrink-0 text-muted-foreground" stroke={1} />
	</Button>
)

type OwnProps = {
	node: TreeNode
}

export const ListEditor = ({ node }: OwnProps) => {
	const items = notNil($valueMap)[node.id] ?? []
	return (
		<div className="flex flex-row w-full h-7 gap-0 items-center">
			<ol className="flex flex-row items-center -ml-1">
				{items.map(item => (
					<Button
						key={`${item.id}`}
						size="sm"
						variant="ghost"
						className="py-0 px-2 h-6 text-md font-normal"
					>
						{item.value.name}
					</Button>
				))}
			</ol>
			<ListButton
				icon={IconSquareRoundedPlus}
				onClick={() => openListItemCreate(node)}
			/>
			<ListButton icon={IconSquareRoundedMinus} onClick={() => void 0} />
		</div>
	)
}
