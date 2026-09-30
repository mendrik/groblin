import { expect, test, vi } from 'vitest'
import type { UpsertValue, Value } from '@/gql/graphql'
import { deferred } from '../../tests/deferred'
import { createValueSaveQueue } from './save-queue'

const data = (content = 'Mine', expectedRevision = 1): UpsertValue => ({
	id: 10,
	node_id: 11,
	list_path: [],
	expectedRevision,
	value: { content }
})
const value = (content = 'Mine', revision = 2): Value => ({
	id: 10,
	node_id: 11,
	list_path: [],
	order: 0,
	revision,
	value: { content },
	updated_at: '2026-09-30T10:00:00.000Z'
})
const setup = () => {
	const records = new Map<string, string>()
	const storage = {
		getItem: vi.fn((key: string) => records.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			records.set(key, value)
		}),
		removeItem: vi.fn((key: string) => {
			records.delete(key)
		})
	}
	const dependencies = {
		storage,
		key: (data: UpsertValue) => `${data.node_id}:${data.list_path?.join(',')}`,
		send: vi.fn<(data: UpsertValue) => Promise<Value>>(),
		read: vi.fn<(data: UpsertValue) => Promise<Value | undefined>>(),
		onSaved: vi.fn()
	}
	const queue = createValueSaveQueue(dependencies)
	queue.configure(1, 'user')
	return { queue, records, ...dependencies, dependencies }
}

test('pending edits remain recoverable until the server acknowledges the save', async () => {
	const { queue, send, onSaved, records } = setup(),
		response = deferred<Value>()
	send.mockReturnValue(response.promise)
	const saving = queue.save(data(), 'Title')
	expect(queue.busy.value).toBe(true)
	expect(queue.hasPending.value).toBe(true)
	expect([...records.values()][0]).toContain('Mine')
	response.resolve(value())
	await expect(saving).resolves.toBe(10)
	expect(onSaved).toHaveBeenCalledWith(value())
	expect(queue.hasPending.value).toBe(false)
	expect(records.size).toBe(0)
})

test('failure retains content and base version across reloads without automatic overwrite', async () => {
	const { queue, dependencies, send } = setup()
	send.mockRejectedValue(new Error('Disconnected'))
	await expect(queue.save(data(), 'Title')).rejects.toThrow('Disconnected')
	expect(queue.edits.value[0]).toMatchObject({ status: 'failed', data: data() })
	const reloaded = createValueSaveQueue(dependencies)
	reloaded.configure(1, 'user')
	expect(reloaded.edits.value[0]).toMatchObject({
		status: 'failed',
		data: data()
	})
	expect(send).toHaveBeenCalledOnce()
	reloaded.configure(2, 'user')
	expect(reloaded.edits.value).toEqual([])
	reloaded.configure(1, 'someone-else')
	expect(reloaded.edits.value).toEqual([])
})

test('typing during a save preserves the newer draft and sends it with the acknowledged version', async () => {
	const { queue, send } = setup(),
		first = deferred<Value>(),
		second = deferred<Value>()
	send.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
	const firstSave = queue.save(data('First'), 'Title')
	const secondSave = queue.save(data('Second'), 'Title')
	expect(send).toHaveBeenCalledOnce()
	first.resolve(value('First', 2))
	await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2))
	expect(send).toHaveBeenLastCalledWith(data('Second', 2))
	expect(queue.hasPending.value).toBe(true)
	second.resolve(value('Second', 3))
	await expect(firstSave).resolves.toBe(10)
	await expect(secondSave).resolves.toBe(10)
	expect(queue.hasPending.value).toBe(false)
})

test('a subscription update cannot silently replace the base version of a dirty editor', async () => {
	const { queue, send } = setup()
	queue.stage(data('Unblurred input', 1), 'Title')
	send.mockResolvedValue(value('Typed later', 2))
	await queue.save(data('Typed later', 7), 'Title')
	expect(send).toHaveBeenCalledWith(data('Typed later', 1))
})

test('conflict requires review and explicit choice before retrying', async () => {
	const { queue, send, read } = setup()
	send.mockRejectedValueOnce(
		Object.assign(new Error('Changed'), { code: 'CONFLICT' })
	)
	await expect(queue.save(data(), 'Title')).rejects.toThrow('Changed')
	const key = queue.edits.value[0]?.key
	if (!key) throw new Error('Missing draft')
	queue.retry(key)
	expect(send).toHaveBeenCalledOnce()
	read.mockResolvedValue(value('Someone else', 5))
	await queue.review(key)
	expect(queue.edits.value[0]).toMatchObject({
		status: 'reviewed',
		latest: value('Someone else', 5)
	})
	expect(send).toHaveBeenCalledOnce()
	send.mockResolvedValueOnce(value('Mine', 6))
	queue.keepMine(key)
	await vi.waitFor(() => expect(queue.hasPending.value).toBe(false))
	expect(send).toHaveBeenLastCalledWith(data('Mine', 5))
})

test('using the saved version discards the retained edit without another mutation', async () => {
	const { queue, read, send, onSaved } = setup()
	const key = queue.stage(data(), 'Title')
	read.mockResolvedValue(value('Latest', 3))
	await queue.review(key)
	queue.discard(key)
	expect(queue.hasPending.value).toBe(false)
	expect(send).not.toHaveBeenCalled()
	expect(onSaved).toHaveBeenCalledWith(value('Latest', 3))
})

test('deleted values can be recreated only after an explicit review', async () => {
	const { queue, read, send } = setup(),
		key = queue.stage(data(), 'Title')
	read.mockResolvedValue(undefined)
	await queue.review(key)
	send.mockResolvedValue(value('Mine', 1))
	queue.keepMine(key)
	await vi.waitFor(() => expect(send).toHaveBeenCalledOnce())
	expect(send).toHaveBeenCalledWith({
		...data(),
		id: undefined,
		expectedRevision: 0
	})
})

test('recovery failures are visible and do not discard in-memory edits', () => {
	const { queue, storage } = setup()
	storage.setItem.mockImplementation(() => {
		throw new Error('Quota exceeded')
	})
	queue.stage(data(), 'Title')
	expect(queue.storageError.value).toContain('Keep this tab open')
	expect(queue.hasPending.value).toBe(true)
})

test('switching projects is blocked while a save is in flight', async () => {
	const { queue, send } = setup(),
		response = deferred<Value>()
	send.mockReturnValue(response.promise)
	const saving = queue.save(data(), 'Title')
	expect(() => queue.configure(2, 'user')).toThrow('Wait for pending saves')
	response.resolve(value())
	await saving
	queue.configure(2, 'user')
	expect(queue.edits.value).toEqual([])
})

test('review failures retain both the edit and conflict status', async () => {
	const { queue, send, read } = setup()
	send.mockRejectedValue(
		Object.assign(new Error('Conflict'), { code: 'CONFLICT' })
	)
	await expect(queue.save(data(), 'Title')).rejects.toThrow('Conflict')
	read.mockRejectedValue(new Error('Still offline'))
	await queue.review(queue.edits.value[0]?.key ?? '')
	expect(queue.edits.value[0]).toMatchObject({
		status: 'conflict',
		error: 'Still offline',
		data: data()
	})
})

test('unreadable recovery files survive scope changes and new edits', () => {
	const { dependencies, records } = setup()
	const key = 'groblin:pending-values:user:1'
	records.set(key, '{incomplete')
	const reloaded = createValueSaveQueue(dependencies)
	reloaded.configure(1, 'user')
	expect(reloaded.storageError.value).toContain('preserved')
	reloaded.stage(data(), 'Title')
	reloaded.configure(2, 'user')
	expect(records.get(key)).toBe('{incomplete')
})
