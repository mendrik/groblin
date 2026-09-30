import type { MediaType } from '@shared/json-value-types'
import { Paperclip } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Value } from '@/gql/graphql'
import { uploadMedia } from '@/lib/upload-file'
import { requireEdit } from '@/state/access'
import { Button } from '../button'
import { Icon } from '../simple/icon'
import { editorKey, type ValueEditor } from './value-editor'

type MediaValue = Omit<Value, 'value'> & { value: MediaType }
export const MediaEditor: ValueEditor<MediaValue> = ({ node, value, save }) => {
	const id = editorKey(node, value)
	const [progress, setProgress] = useState(0)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string>()
	const controller = useRef<AbortController | undefined>(undefined)
	useEffect(() => () => controller.current?.abort(), [])
	const upload = async (file: File) => {
		setBusy(true)
		setError(undefined)
		setProgress(0)
		const request = new AbortController()
		controller.current = request
		try {
			requireEdit()
			const media = await uploadMedia(file, {
				signal: request.signal,
				onProgress: setProgress
			})
			request.signal.throwIfAborted()
			requireEdit()
			await save(media)
		} catch (error) {
			if (!request.signal.aborted)
				setError(error instanceof Error ? error.message : 'File upload failed.')
		} finally {
			if (!request.signal.aborted) setBusy(false)
		}
	}
	const cancel = () => {
		controller.current?.abort()
		setBusy(false)
		setError('Upload canceled. The existing file is unchanged.')
	}
	return (
		<div className="max-w-full flex flex-wrap gap-2 items-center" id={id}>
			<label className="cursor-pointer flex items-center gap-1">
				<Icon icon={Paperclip} />
				<span>Upload file</span>
				<input
					aria-label={`Upload ${node.name}`}
					type="file"
					className="max-w-48 text-xs"
					disabled={busy}
					onChange={event => {
						const file = event.target.files?.[0]
						if (file) void upload(file)
						event.target.value = ''
					}}
				/>
			</label>
			<span className="truncate">{value?.value.name}</span>
			{value && (
				<span className="text-xs text-muted-foreground">
					{value.value.contentType} · {Math.ceil(value.value.size / 1024)} KiB
					{value.value.width && value.value.height
						? ` · ${value.value.width}×${value.value.height}`
						: ''}
				</span>
			)}
			{busy && (
				<>
					<progress
						aria-label="File upload progress"
						max={100}
						value={progress}
					/>
					<span role="status">
						{progress === 100
							? 'Verifying and saving…'
							: `Uploading ${progress}%`}
					</span>
					<Button variant="secondary" size="sm" onClick={cancel}>
						Cancel upload
					</Button>
				</>
			)}
			{error && <p role="alert">{error}</p>}
		</div>
	)
}
