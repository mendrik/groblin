import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { inputValue, stopPropagation } from '@/lib/dom-events'
import { pipeAsync } from '@shared/utils/pipe-async'
import { objOf, pipe } from 'ramda'
import { useState } from 'react'
import { type ValueEditor, editorKey } from './value-editor'

type StringValue = Omit<Value, 'value'> & { value: { content: string } }

export const StringEditor: ValueEditor<StringValue> = ({
	node,
	value,
	save
}) => {
	const [text, setText] = useState(() => value?.value?.content)
	return (
		<KeyListener
			onArrowLeft={stopPropagation}
			onArrowRight={stopPropagation}
			className="relative w-min"
		>
			<div className="relative opacity-0 pointer-events-none top-0 h-0 w-fit">
				{text}
			</div>
			<input
				id={editorKey(node, value)}
				key={editorKey(node, value)}
				className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0"
				defaultValue={value?.value?.content}
				onChange={pipe(inputValue, setText)}
				onBlur={pipeAsync(inputValue, objOf('content'), save)}
			/>
		</KeyListener>
	)
}
