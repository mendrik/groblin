import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { inputValue, stopPropagation } from '@/lib/dom-events'
import { pipeAsync } from '@shared/utils/pipe-async'
import { objOf } from 'ramda'
import { type ValueEditor, editorKey } from './value-editor'

type StringValue = Omit<Value, 'value'> & { value: { content: string } }

export const StringEditor: ValueEditor<StringValue> = ({
	node,
	value,
	save
}) => (
	<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
		<input
			id={editorKey(node, value)}
			key={editorKey(node, value)}
			className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0"
			defaultValue={value?.value?.content ?? undefined}
			onBlur={pipeAsync(inputValue, objOf('content'), save)}
		/>
	</KeyListener>
)
