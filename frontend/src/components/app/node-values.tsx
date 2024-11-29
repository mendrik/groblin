import { $openNodes } from '@/state/tree'
import { $valueMap } from '@/state/value'
import { ColorPicker } from '../ui/color-picker'
import { ListItemCreate } from '../ui/values/list-item-create'
import { ListItemDelete } from '../ui/values/list-item-delete'
import { ValueEditor } from '../ui/values/value-editor'
import FocusTravel from '../utils/focus-travel'

export const NodeValues = () => {
	return (
		<>
			<FocusTravel>
				<ol className="flex flex-col text-sm px-2 grid-lines">
					{$openNodes.value.map(node => (
						<li key={node.id} className="h-7 flex flex-row items-center">
							<ValueEditor node={node} value={$valueMap.value[node.id]} />
						</li>
					))}
				</ol>
			</FocusTravel>
			<ListItemCreate />
			<ListItemDelete />
			<ColorPicker />
		</>
	)
}
