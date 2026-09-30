import type { ChoiceType } from '@shared/json-value-types'
import { debugFn } from '@shared/utils/ramda'
import { identity, objOf, pipe, when } from 'ramda'
import { isNotNilOrEmpty } from 'ramda-adjunct'
import type { Value } from '@/gql/graphql'
import { $nodeSettingsMap } from '@/state/node-settings'
import { SimpleSelect } from '../simple/select'
import { ChoiceProps } from '../tree/properties/choice'
import type { ValueEditor } from './value-editor'

type ChoiceValue = Omit<Value, 'value'> & { value: ChoiceType }

export const ChoiceEditor: ValueEditor<ChoiceValue> = ({
	node,
	value,
	save
}) => {
	const settings = ChoiceProps.parse(
		$nodeSettingsMap.value[node.id]?.settings ?? {}
	)

	return (
		<SimpleSelect<string>
			getKey={identity}
			className="h-6 border-none p-1 min-w-10 -ml-1"
			options={settings?.choices ?? []}
			allowEmpty={settings?.required !== true}
			render={identity}
			onChange={when(isNotNilOrEmpty, pipe(objOf('selected'), debugFn(save)))}
			value={value?.value.selected}
		/>
	)
}
