import type { BooleanType } from '@shared/json-value-types'
import { objOf, pipe } from 'ramda'
import type { Value } from '@/gql/graphql'
import { Switch } from '../switch'
import { editorKey, type ValueEditor } from './value-editor'

type BooleanValue = Omit<Value, 'value'> & { value: BooleanType }

export const BooleanEditor: ValueEditor<BooleanValue> = ({
	node,
	value,
	save
}) => {
	const saveNewValue = pipe(objOf('state'), save)
	return (
		<Switch
			key={editorKey(node, value)}
			onCheckedChange={saveNewValue}
			defaultChecked={value?.value.state}
		/>
	)
}
