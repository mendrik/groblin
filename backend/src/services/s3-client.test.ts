import 'reflect-metadata'
import { S3Client as AwsS3 } from '@aws-sdk/client-s3'
import { Container } from 'inversify'
import { expect, test, vi } from 'vitest'
import { S3Client } from './s3-client.ts'

test('import reads stop and cancel the response stream at the size limit', async () => {
	const cancel = vi.fn()
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(11))
		},
		cancel
	})
	const send = vi
		.fn()
		.mockResolvedValue({ Body: { transformToWebStream: () => body } })
	const container = new Container()
	container.bind(AwsS3).toConstantValue({ send } as unknown as AwsS3)
	container.bind(S3Client).toSelf()
	await expect(
		container.get(S3Client).getContent('project_1/test', 10)
	).rejects.toThrow('Import is too large')
	expect(cancel).toHaveBeenCalledOnce()
})

test('bounded import reads preserve multibyte UTF-8 split across chunks at the exact byte limit', async () => {
	const bytes = Buffer.from('["Häme"]')
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
			controller.close()
		}
	})
	const send = vi
		.fn()
		.mockResolvedValue({ Body: { transformToWebStream: () => body } })
	const container = new Container()
	container.bind(AwsS3).toConstantValue({ send } as unknown as AwsS3)
	container.bind(S3Client).toSelf()
	await expect(
		container.get(S3Client).getContent('project_1/test', bytes.length)
	).resolves.toBe('["Häme"]')
	expect(body.locked).toBe(false)
})

test('size limits accumulate across chunks and release the stream lock on rejection', async () => {
	const cancel = vi.fn()
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array(6))
			controller.enqueue(new Uint8Array(5))
		},
		cancel
	})
	const send = vi
		.fn()
		.mockResolvedValue({ Body: { transformToWebStream: () => body } })
	const container = new Container()
	container.bind(AwsS3).toConstantValue({ send } as unknown as AwsS3)
	container.bind(S3Client).toSelf()
	await expect(
		container.get(S3Client).getContent('project_1/test', 10)
	).rejects.toThrow('Import is too large')
	expect(cancel).toHaveBeenCalledOnce()
	expect(body.locked).toBe(false)
})

test('missing S3 response bodies fail explicitly', async () => {
	const container = new Container()
	container.bind(AwsS3).toConstantValue({
		send: vi.fn().mockResolvedValue({})
	} as unknown as AwsS3)
	container.bind(S3Client).toSelf()
	await expect(
		container.get(S3Client).getContent('project_1/test')
	).rejects.toThrow('No body in response')
})

test('media byte uploads, reads and deletion preserve SDK command inputs and failures', async () => {
	const aws = new AwsS3({
		region: 'eu-north-1',
		credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
	})
	const send = vi.spyOn(aws, 'send')
	const container = new Container()
	container.bind(AwsS3).toConstantValue(aws)
	container.bind(S3Client).toSelf()
	const storage = container.get(S3Client)
	const bytes = Buffer.from([0, 128, 255])
	const key = 'project_1/test'
	send.mockImplementation(async () => ({}))
	await storage.uploadBytes(key, bytes, { ContentType: 'image/png' })
	expect(send).toHaveBeenLastCalledWith(
		expect.objectContaining({
			input: expect.objectContaining({
				Key: key,
				Body: bytes,
				ContentType: 'image/png'
			})
		})
	)
	send.mockImplementation(async () => ({
		Body: {
			transformToWebStream: () =>
				new ReadableStream({
					start(controller) {
						controller.enqueue(bytes)
						controller.close()
					}
				})
		}
	}))
	expect(await storage.getBytes(key)).toEqual(bytes)
	send.mockImplementation(async () => ({}))
	expect(await storage.exists(key)).toBe(true)
	send.mockRejectedValueOnce(new Error('NoSuchKey'))
	expect(await storage.exists(key)).toBe(false)
	await storage.deleteFile(key)
	expect(send).toHaveBeenLastCalledWith(
		expect.objectContaining({ input: expect.objectContaining({ Key: key }) })
	)
	send.mockRejectedValueOnce(new Error('AccessDenied'))
	await expect(storage.uploadBytes(key, bytes, {})).rejects.toThrow(
		'AccessDenied'
	)
	aws.destroy()
})

test('project cleanup paginates and deletes only the exact project directory', async () => {
	const aws = new AwsS3({
		region: 'eu-north-1',
		credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
	})
	const send = vi.spyOn(aws, 'send').mockImplementation(async command => {
		if (command.constructor.name === 'ListObjectsV2Command') {
			if (
				'ContinuationToken' in command.input &&
				command.input.ContinuationToken
			)
				return { Contents: [{ Key: 'project_1/second' }] }
			return {
				IsTruncated: true,
				NextContinuationToken: 'page2',
				Contents: [{ Key: 'project_1/first' }, { Key: 'project_10/private' }]
			}
		}
		return {}
	})
	const container = new Container()
	container.bind(AwsS3).toConstantValue(aws)
	container.bind(S3Client).toSelf()
	await container.get(S3Client).deleteProjectPrefix('project_1/')
	const deleted = send.mock.calls.filter(
		([command]) => command.constructor.name === 'DeleteObjectCommand'
	)
	expect(
		deleted.map(([command]) =>
			'Key' in command.input ? command.input.Key : null
		)
	).toEqual(['project_1/first', 'project_1/second'])
	await expect(
		container.get(S3Client).deleteProjectPrefix('project_1')
	).rejects.toThrow('Invalid project prefix')
	aws.destroy()
})

test('media cleanup includes paginated thumbnails and avoids adjacent filenames', async () => {
	const aws = new AwsS3({
		region: 'eu-north-1',
		credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
	})
	const send = vi.spyOn(aws, 'send').mockImplementation(async command => {
		if (command.constructor.name === 'ListObjectsV2Command') {
			if (
				'ContinuationToken' in command.input &&
				command.input.ContinuationToken
			)
				return { Contents: [{ Key: 'project_1/file_1280' }] }
			return {
				IsTruncated: true,
				NextContinuationToken: 'page2',
				Contents: [
					{ Key: 'project_1/file' },
					{ Key: 'project_1/file_640' },
					{ Key: 'project_1/file-other' }
				]
			}
		}
		return {}
	})
	const container = new Container()
	container.bind(AwsS3).toConstantValue(aws)
	container.bind(S3Client).toSelf()
	await container.get(S3Client).deleteFileAndThumbnails('project_1/file')
	const deleted = send.mock.calls.filter(
		([command]) => command.constructor.name === 'DeleteObjectCommand'
	)
	expect(
		deleted.map(([command]) =>
			'Key' in command.input ? command.input.Key : null
		)
	).toEqual(['project_1/file', 'project_1/file_640', 'project_1/file_1280'])
	aws.destroy()
})
