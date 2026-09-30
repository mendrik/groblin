import { mediaValueSchema } from '@shared/content'
import { type UploadInput, uploadInputSchema } from '@shared/media-upload'
import { Api } from '@/gql-client'

type Options = {
	purpose?: UploadInput['purpose']
	signal?: AbortSignal
	onProgress?: (percent: number) => void
}
export async function uploadFile(file: File, options: Options = {}) {
	const input = uploadInputSchema.parse({
		filename: file.name,
		contentType: file.type || 'application/octet-stream',
		size: file.size,
		purpose: options.purpose ?? 'MEDIA'
	})
	options.signal?.throwIfAborted()
	const upload = await Api.UploadUrl({ data: input })
	options.signal?.throwIfAborted()
	await new Promise<void>((resolve, reject) => {
		const request = new XMLHttpRequest()
		const abort = () => request.abort()
		request.open('PUT', upload.signedUrl)
		request.setRequestHeader('Content-Type', input.contentType)
		request.upload.onprogress = event => {
			if (event.lengthComputable)
				options.onProgress?.(
					Math.min(99, Math.round((event.loaded / event.total) * 100))
				)
		}
		request.onload = () => {
			if (request.status >= 200 && request.status < 300) resolve()
			else reject(new Error(`Upload failed (${request.status}). Try again.`))
		}
		request.onerror = () => reject(new Error('Upload disconnected. Try again.'))
		request.onabort = () =>
			reject(new DOMException('Upload canceled', 'AbortError'))
		request.onloadend = () =>
			options.signal?.removeEventListener('abort', abort)
		options.signal?.addEventListener('abort', abort, { once: true })
		request.send(file)
	})
	options.onProgress?.(100)
	return upload.object
}
export async function uploadMedia(
	file: File,
	options: Omit<Options, 'purpose'> = {}
) {
	const key = await uploadFile(file, { ...options, purpose: 'MEDIA' })
	options.signal?.throwIfAborted()
	const media = await Api.FinalizeUpload({ key })
	options.signal?.throwIfAborted()
	const { width, height, ...content } = media
	return mediaValueSchema.parse({
		...content,
		...(width == null ? {} : { width }),
		...(height == null ? {} : { height })
	})
}
