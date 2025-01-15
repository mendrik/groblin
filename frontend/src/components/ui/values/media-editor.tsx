import type { Value } from '@/gql/graphql'
import { assertExists, assertThat } from '@shared/asserts'
import { pipeAsync } from '@shared/utils/pipe-async'

import { Paperclip } from 'lucide-react'
import { is } from 'ramda'
import { toast } from 'sonner'
import { Icon } from '../simple/icon'
import { uploadToS3 } from '../zod-form/utils'
import { type ValueEditor, editorKey } from './value-editor'

type Bytes = number

type Media = {
	name: string
	file: string
	contentType: string
	size: Bytes
}

type MediaValue = Omit<Value, 'value'> & {
	value: {
		media: Media
	}
}

const upload = async (ev: React.ChangeEvent): Promise<Media> => {
	assertThat(is(HTMLInputElement), ev.target, 'ev.target')
	assertExists(ev.target.files?.[0], 'ev.target.files missing')
	const source = ev.target.files[0]
	return await uploadToS3(source)
		.then(file => ({
			file,
			name: source.name,
			contentType: source.type,
			size: source.size
		}))
		.catch(e => {
			toast.error('Failed to upload file', {
				description: e.message,
				closeButton: true
			})
			throw e
		})
}

export const MediaEditor: ValueEditor<MediaValue> = ({ node, value, save }) => {
	const id = editorKey(node, value)
	return (
		<div
			className="max-w-full flex flex-row gap-1 items-center"
			id={id}
			key={id}
		>
			<label
				className="myLabel h-5 w-5 -ml-1 cursor-pointer"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
				tabIndex={0}
				title="Upload file"
			>
				<Icon icon={Paperclip} />
				<input
					type="file"
					className="hidden"
					onChange={pipeAsync(upload, save)}
				/>
			</label>
			<span className="text-ellipsis overflow-hidden truncate">
				{value?.value.name}
			</span>
		</div>
	)
}
