import { $openNodes } from '@/state/tree'
import { $valueMap, activePath } from '@/state/value'
import { ColorPicker } from '../ui/color-picker'
import { DatePicker } from '../ui/date-picker/date-picker-dialog'
import { ListItemCreate } from '../ui/values/list-item-create'
import { ListItemDelete } from '../ui/values/list-item-delete'
import { ListItemEdit } from '../ui/values/list-item-edit'
import { ValueEditor } from '../ui/values/value-editor'
import FocusTravel from '../utils/focus-travel'

export const NodeValues = () => {
	return (
		<>
			<FocusTravel autoFocus={false}>
				<ol className="flex flex-col text-sm px-2 grid-lines">
					{$openNodes.value.map(node => (
						<li key={node.id} className="h-7 flex flex-row items-center">
							<ValueEditor
								node={node}
								value={$valueMap.value[node.id]}
								listPath={activePath(node)}
							/>
						</li>
					))}
				</ol>
			</FocusTravel>
			<ListItemCreate />
			<ListItemDelete />
			<ListItemEdit />
			<ColorPicker />
			<DatePicker />
		</>
	)
}
