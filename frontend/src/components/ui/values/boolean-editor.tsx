import type { Value } from '@/gql/graphql'
import { objOf, pipe } from 'ramda'
import { Switch } from '../switch'
import { type ValueEditor, editorKey } from './value-editor'

type BooleanValue = Value & { value: { state: boolean } }

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
