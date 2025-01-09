import type { Value } from '@/gql/graphql'
import { $nodeSettings } from '@/state/node-settings'
import { identity, objOf, pipe, when } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import { SimpleSelect } from '../simple/select'
import type { ChoiceProps } from '../tree/properties/choice'
import type { ValueEditor } from './value-editor'

type ChoiceValue = Omit<Value, 'value'> & { value: { selected: string } }

export const ChoiceEditor: ValueEditor<ChoiceValue> = ({
	node,
	value,
	save
}) => {
	const settings: ChoiceProps | undefined =
		$nodeSettings.value[node.id]?.settings
	return (
		<SimpleSelect<string>
			options={settings?.choices ?? []}
			render={identity}
			onChange={when(isNotNilOrEmpty, pipe(objOf('selected'), save))}
			value={value?.value.selected}
		/>
	)
}
