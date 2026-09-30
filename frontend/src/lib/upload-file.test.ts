import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { deferred } from '../../tests/deferred'
import { uploadFile, uploadMedia } from './upload-file'

const mocks = vi.hoisted(() => ({
	UploadUrl: vi.fn(),
	FinalizeUpload: vi.fn()
}))
vi.mock('@/gql-client', () => ({ Api: mocks }))
let requests: XMLHttpRequest[] = []
beforeEach(() => {
	vi.resetAllMocks()
	requests = []
	mocks.UploadUrl.mockResolvedValue({
		object: 'project_1/stage',
		signedUrl: 'https://storage.invalid/stage'
	})
	vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {})
	vi.spyOn(XMLHttpRequest.prototype, 'setRequestHeader').mockImplementation(
		() => {}
	)
	vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(function (
		this: XMLHttpRequest
	) {
		requests.push(this)
	})
	vi.spyOn(XMLHttpRequest.prototype, 'abort').mockImplementation(function (
		this: XMLHttpRequest
	) {
		this.dispatchEvent(new Event('abort'))
		this.dispatchEvent(new Event('loadend'))
	})
})
afterEach(() => vi.restoreAllMocks())
const file = new File(['verified bytes'], 'photo.png', { type: 'image/png' })
const request = async () => {
	await vi.waitFor(() => expect(requests).toHaveLength(1))
	const value = requests[0]
	if (!value) throw new Error('Missing upload request')
	return value
}
const finish = (xhr: XMLHttpRequest, status = 200) => {
	Object.defineProperty(xhr, 'status', { value: status })
	xhr.dispatchEvent(new Event('load'))
	xhr.dispatchEvent(new Event('loadend'))
}

test('media upload reports progress and awaits server verification before returning immutable metadata', async () => {
	const verification = deferred<{
		file: string
		name: string
		size: number
		contentType: string
		width: null
		height: null
	}>()
	mocks.FinalizeUpload.mockReturnValue(verification.promise)
	const progress = vi.fn()
	const pending = uploadMedia(file, { onProgress: progress })
	const xhr = await request()
	xhr.upload.dispatchEvent(
		new ProgressEvent('progress', {
			lengthComputable: true,
			loaded: 5,
			total: 10
		})
	)
	expect(progress).toHaveBeenCalledWith(50)
	finish(xhr)
	await vi.waitFor(() =>
		expect(mocks.FinalizeUpload).toHaveBeenCalledExactlyOnceWith({
			key: 'project_1/stage'
		})
	)
	verification.resolve({
		file: 'project_1/sealed',
		name: file.name,
		size: file.size,
		contentType: file.type,
		width: null,
		height: null
	})
	expect(await pending).toMatchObject({
		file: 'project_1/sealed'
	})
	expect(mocks.UploadUrl).toHaveBeenCalledExactlyOnceWith({
		data: {
			filename: file.name,
			contentType: file.type,
			size: file.size,
			purpose: 'MEDIA'
		}
	})
})

test('cancellation rejects the upload and prevents finalization and pre-aborted requests never start', async () => {
	const controller = new AbortController()
	const pending = uploadMedia(file, { signal: controller.signal })
	const rejection = expect(pending).rejects.toMatchObject({
		name: 'AbortError'
	})
	await request()
	controller.abort()
	await rejection
	expect(mocks.FinalizeUpload).not.toHaveBeenCalled()
	const calls = mocks.UploadUrl.mock.calls.length
	await expect(
		uploadMedia(file, { signal: controller.signal })
	).rejects.toMatchObject({ name: 'AbortError' })
	expect(mocks.UploadUrl).toHaveBeenCalledTimes(calls)
})

test('storage errors preserve failure details and bounds are checked before preparing an upload', async () => {
	const pending = uploadFile(file, { purpose: 'JSON_IMPORT' })
	const rejection = expect(pending).rejects.toThrow('Upload failed (403)')
	finish(await request(), 403)
	await rejection
	expect(mocks.FinalizeUpload).not.toHaveBeenCalled()
	await expect(
		uploadFile(new File([], 'empty.png', { type: 'image/png' }))
	).rejects.toThrow()
})

test('files without image dimensions remain valid JSON for the durable save queue', async () => {
	mocks.FinalizeUpload.mockResolvedValue({
		file: 'project_1/sealed',
		name: 'data.txt',
		contentType: 'text/plain',
		size: 3,
		width: null,
		height: null
	})
	const pending = uploadMedia(
		new File(['abc'], 'data.txt', { type: 'text/plain' })
	)
	finish(await request())
	const content = await pending
	expect(z.json().safeParse(content).success).toBe(true)
	expect(content).not.toHaveProperty('width')
	expect(content).not.toHaveProperty('height')
})
