import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { $nodeSettingsMap } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { objOf, pipe } from 'ramda'
import { MaskedInput } from '../random/masked-input'
import type { NumberProps } from '../tree/properties/numbers'
import { editorKey, save } from './value-editor'

type NumberValue = Value & { value: { figure: number } }

type OwnProps = {
	node: TreeNode
	value?: NumberValue
}

export const NumberEditor = ({ node, value }: OwnProps) => {
	const saveNewValue = pipe(objOf('figure'), save(node, value))
	const settings = $nodeSettingsMap.value[node.id]?.settings as
		| NumberProps
		| undefined

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
				className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0"
				onAccept={pipe(Number.parseFloat, saveNewValue)}
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
