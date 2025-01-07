import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { IconFileUpload } from '@tabler/icons-react'
import { type ValueEditor, editorKey } from './value-editor'

type Bytes = number

type Media = {
	file: string
	contentType: string
	size: Bytes
}

type MediaValue = Value & {
	value: {
		media: Media
	}
}

const doUpload = () => {
	console.log('uploading...')
}

export const MediaEditor: ValueEditor<MediaValue> = ({ node, value, save }) => {
	const id = editorKey(node, value)
	const onChange = console.log
	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<label className="myLabel h-7 p-1 cursor-pointer">
				<IconFileUpload stroke={0.5} className="w-5 h-5" />
				<input
					type="file"
					id={id}
					key={id}
					className="hidden"
					onChange={onChange}
				/>
			</label>
		</KeyListener>
	)
}
