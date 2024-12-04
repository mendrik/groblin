import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { notNil } from '@/lib/utils'
import { $nodeSettingsMap } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { objOf, pipe } from 'ramda'
import { IMaskMixin } from 'react-imask'
import type { NumberProps } from '../tree/properties/numbers'
import { editorKey, save } from './value-editor'

type NumberValue = Value & { value: { figure: number } }

type OwnProps = {
	node: TreeNode
	value?: NumberValue
}

const MaskedStyledInput = IMaskMixin(({ inputRef, ...props }) => (
	<input
		ref={inputRef as any}
		className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0 ml-1"
		{...props}
	/>
))

export const NumberEditor = ({ node, value }: OwnProps) => {
	const saveNewValue = pipe(objOf('figure'), save(node, value))
	const settings = notNil($nodeSettingsMap, node.id).settings as NumberProps

	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<MaskedStyledInput
				key={editorKey(node)}
				mask={`num ${settings.unit}`}
				defaultValue={value?.value.figure}
				lazy={false}
				onAccept={saveNewValue}
				blocks={{
					num: {
						scale: settings.precision,
						autofix: true,
						mask: Number,
						unmask: 'typed',
						radix: ',',
						thousandsSeparator: '🞝'
					}
				}}
			/>
		</KeyListener>
	)
}
