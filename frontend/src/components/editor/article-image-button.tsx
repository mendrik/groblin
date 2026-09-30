import { assetPath } from '@shared/article-assets'
import type { Editor } from '@tiptap/core'
import { Image } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { uploadMedia } from '@/lib/upload-file'
import { requireEdit } from '@/state/access'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export function ArticleImageButton({ editor }: { editor: Editor }) {
	const [open, setOpen] = useState(false)
	const [file, setFile] = useState<File>()
	const [alt, setAlt] = useState('')
	const [busy, setBusy] = useState(false)
	const [progress, setProgress] = useState(0)
	const [error, setError] = useState<string>()
	const request = useRef<AbortController | undefined>(undefined)
	useEffect(() => () => request.current?.abort(), [])
	const insert = async () => {
		if (!file) return
		const controller = new AbortController()
		request.current = controller
		setBusy(true)
		setError(undefined)
		setProgress(0)
		try {
			requireEdit()
			const media = await uploadMedia(file, {
				signal: controller.signal,
				onProgress: setProgress
			})
			controller.signal.throwIfAborted()
			requireEdit()
			if (!media.contentType.startsWith('image/'))
				throw new Error('Choose an image file.')
			if (
				editor.isDestroyed ||
				!editor
					.chain()
					.focus()
					.setImage({ src: assetPath(media.file), alt, title: media.name })
					.run()
			)
				throw new Error('Could not insert this image.')
			setOpen(false)
			setFile(undefined)
			setAlt('')
		} catch (error) {
			if (!controller.signal.aborted)
				setError(
					error instanceof Error ? error.message : 'Image upload failed.'
				)
		} finally {
			if (!controller.signal.aborted) setBusy(false)
		}
	}
	return (
		<Popover
			open={open}
			onOpenChange={value => {
				if (!busy) setOpen(value)
			}}
		>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Add image">
					<Image size={20} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<form
					className="space-y-3"
					onSubmit={event => {
						event.preventDefault()
						void insert()
					}}
				>
					<label htmlFor="article-image-file">Image file</label>
					<Input
						id="article-image-file"
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
						required
						disabled={busy}
						onChange={event => setFile(event.target.files?.[0])}
					/>
					<label htmlFor="article-image-alt">Image description</label>
					<Input
						id="article-image-alt"
						value={alt}
						maxLength={500}
						disabled={busy}
						onChange={event => setAlt(event.target.value)}
					/>
					<p className="text-xs">
						Describe the image for screen readers. Leave blank for decoration.
					</p>
					{error && <p role="alert">{error}</p>}
					{busy && (
						<>
							<progress
								aria-label="Image upload progress"
								max={100}
								value={progress}
							/>
							<p role="status">
								{progress === 100
									? 'Verifying image…'
									: `Uploading ${progress}%`}
							</p>
						</>
					)}
					<Button type="submit" disabled={busy || !file}>
						Insert image
					</Button>
					<Button
						variant="secondary"
						onClick={() => {
							request.current?.abort()
							setBusy(false)
							setOpen(false)
						}}
					>
						Cancel
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	)
}
