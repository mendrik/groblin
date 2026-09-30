import type { NumberType } from '@shared/json-value-types'
import { objOf, pipe } from 'ramda'
import { useState } from 'react'
import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { MaskedInput } from '../random/masked-input'
import { NumberProps } from '../tree/properties/numbers'
import { editorKey, type ValueEditor } from './value-editor'

type NumberValue = Omit<Value, 'value'> & { value: NumberType }

export const NumberEditor: ValueEditor<NumberValue> = ({
	node,
	value,
	settings: rawSettings,
	save,
	stage
}) => {
	const settings = NumberProps.parse(rawSettings ?? {})
	const saveNewValue = pipe(objOf('figure'), save)
	const [ok, setOk] = useState(value?.value.figure)

	return (
		<KeyListener
			onArrowLeft={stopPropagation}
			onArrowRight={stopPropagation}
			key={editorKey(node, value)}
		>
			<MaskedInput
				mask={
					settings?.unit && value?.value.figure
						? `num ${settings.unit.replace(/[0a*[\]{}`]/g, '\\$&')}`
						: 'num'
				}
				defaultValue={value?.value.figure}
				lazy={false}
				className="h-7 w-full bg-transparent border-none appearance-none outline-hidden ring-0"
				onAccept={(_text: string, mask: { typedValue: unknown }) => {
					const figure = Number.parseFloat(String(mask.typedValue))
					setOk(figure)
					if (Number.isFinite(figure)) stage?.({ figure })
				}}
				onBlur={() => saveNewValue(ok)}
				blocks={{
					num: {
						scale: settings?.precision ?? 0,
						autofix: true,
						mask: Number,
						unmask: 'typed',
						radix: '.',
						min: settings?.minimum ?? Number.NEGATIVE_INFINITY,
						max: settings?.maximum ?? Number.POSITIVE_INFINITY,
						thousandsSeparator: ','
					}
				}}
			/>
		</KeyListener>
	)
}
