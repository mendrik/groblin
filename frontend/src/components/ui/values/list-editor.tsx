import { notNil } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { $valueMap } from '@/state/value'
import {
	IconSquareRoundedPlus as Minus,
	IconSquareRoundedMinus as Plus
} from '@tabler/icons-react'
import { Button } from '../button'
import { MicroIcon } from '../random/micro-icon'
import { openListItemCreate } from './list-item-create'

type OwnProps = {
	node: TreeNode
}

export const ListEditor = ({ node }: OwnProps) => {
	const items = notNil($valueMap)[node.id] ?? []
	return (
		<div className="flex flex-row w-full h-7 gap-0 items-center">
			<ol className="flex flex-row items-center -ml-1 divide-x">
				{items.map(item => (
					<li key={`${item.id}`}>
						<Button
							size="sm"
							variant="ghost"
							className="py-0 px-2 h-6 text-md font-normal"
						>
							{item.value.name}
						</Button>
					</li>
				))}
			</ol>
			<MicroIcon icon={Plus} onClick={() => openListItemCreate(node)} />
			<MicroIcon icon={Minus} onClick={() => void 0} />
		</div>
	)
}
