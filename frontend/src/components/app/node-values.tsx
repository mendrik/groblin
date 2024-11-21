import { $openNodes } from '@/state/tree'
import { ListItemCreate } from '../ui/values/list-item-create'
import { ListItemDelete } from '../ui/values/list-item-delete'
import { ValueEditor } from '../ui/values/value-editor'

export const NodeValues = () => {
	return (
		<>
			<ol className="flex flex-col text-sm px-2 grid-lines">
				{$openNodes.value.map(node => (
					<li key={node.id} className="h-7 flex flex-row items-center">
						<ValueEditor node={node} />
					</li>
				))}
			</ol>
			<ListItemCreate />
			<ListItemDelete />
		</>
	)
}
