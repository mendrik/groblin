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
	const [text, setText] = useState(value?.value?.content)
	return (
		<KeyListener
			onArrowLeft={stopPropagation}
			onArrowRight={stopPropagation}
			className="max-w-[200px]"
			key={editorKey(node, value)}
		>
			<div className="pointer-events-none opacity-0 h-0 min-w-fit whitespace-nowrap">
				{text}
			</div>
			<input
				id={editorKey(node, value)}
				className="h-7 w-full bg-transparent border-none appearance-none outline-none ring-0 min-w-[30px]"
				defaultValue={value?.value?.content}
				onChange={pipe(inputValue, setText)}
				onBlur={pipeAsync(inputValue, objOf('content'), save)}
			/>
		</KeyListener>
	)
}
