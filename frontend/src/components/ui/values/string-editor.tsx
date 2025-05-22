import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { inputValue, stopPropagation } from '@/lib/dom-events'
import type { StringType } from '@shared/json-value-types'
import { pipeAsync } from 'matchblade'
import { objOf, pipe } from 'ramda'
import { useState } from 'react'
import { type ValueEditor, editorKey } from './value-editor'

type StringValue = Omit<Value, 'value'> & { value: StringType }
export const StringEditor: ValueEditor<StringValue> = ({
	node,
	value,
	save
}) => {
	const [text, setText] = useState(value?.value?.content)
	return (
		<KeyListener
			onArrowLeft={stopPropagation}
			onArrowRight={stopPropagation}
			className="max-w-[200px]"
			key={editorKey(node, value)}
		>
			<input
				id={editorKey(node, value)}
				className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0 min-w-[30px] field-sizing"
				defaultValue={value?.value?.content}
				onChange={pipe(inputValue, setText)}
				onBlur={pipeAsync(inputValue, objOf('content'), save)}
			/>
		</KeyListener>
	)
}
