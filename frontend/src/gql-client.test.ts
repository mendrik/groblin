import type { FormattedExecutionResult } from 'graphql'
import { createClient } from 'graphql-ws'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { deferred } from '../tests/deferred'

const pending = () => deferred<IteratorResult<FormattedExecutionResult>>()
const done = { done: true as const, value: undefined }

function transport() {
	const response = pending()
	const iterator = {
		next: vi
			.fn()
			.mockReturnValueOnce(response.promise)
			.mockReturnValue(pending().promise),
		return: vi.fn().mockImplementation(async () => {
			response.resolve(done)
			return done
		}),
		throw: vi.fn(),
		[Symbol.asyncIterator]() {
			return this
		}
	}
	const iterate = vi.fn().mockReturnValue(iterator)
	const dispose = vi.fn().mockResolvedValue(undefined)
	vi.mocked(createClient).mockReturnValue({
		iterate,
		dispose
	} as unknown as ReturnType<typeof createClient>)
	return { response, iterator, iterate, dispose }
}

beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.restoreAllMocks()
})

test('uses the current origin for the default WebSocket endpoint', async () => {
	transport()
	vi.stubEnv('VITE_GRAPHQL_WS_URL', undefined)
	await import('./gql-client')
	const expected = new URL('/graphql', window.location.href)
	expected.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
	expect(createClient).toHaveBeenCalledWith(
		expect.objectContaining({ url: expected.href })
	)
})

test('uses secure WebSockets for an HTTPS deployment override', async () => {
	transport()
	vi.stubEnv('VITE_GRAPHQL_WS_URL', 'https://cms.example.invalid/graphql')
	await import('./gql-client')
	expect(createClient).toHaveBeenCalledWith(
		expect.objectContaining({ url: 'wss://cms.example.invalid/graphql' })
	)
})

test('queries unwrap data and release their transport iterator', async () => {
	const { response, iterator } = transport()
	const { Api } = await import('./gql-client')
	const request = Api.GetNodes()
	response.resolve({ done: false, value: { data: { getNodes: [{ id: 1 }] } } })
	await expect(request).resolves.toEqual([{ id: 1 }])
	expect(iterator.return).toHaveBeenCalledOnce()
})

test('GraphQL query errors reject and release the iterator', async () => {
	const { response, iterator } = transport()
	const { Api } = await import('./gql-client')
	const request = Api.GetNodes()
	response.resolve({
		done: false,
		value: { errors: [{ message: 'Forbidden' }] }
	})
	await expect(request).rejects.toBeDefined()
	expect(iterator.return).toHaveBeenCalledOnce()
})

test('transport failures reject queries and release the iterator', async () => {
	const { response, iterator } = transport()
	const { Api } = await import('./gql-client')
	const request = Api.GetNodes()
	response.reject(new Error('Disconnected'))
	await expect(request).rejects.toThrow('Disconnected')
	expect(iterator.return).toHaveBeenCalledOnce()
})

test('GraphQL conflicts preserve their code and message for the editor', async () => {
	const { response } = transport()
	const { Api } = await import('./gql-client')
	const request = Api.GetNodes()
	response.resolve({
		done: false,
		value: {
			errors: [{ message: 'Content changed', extensions: { code: 'CONFLICT' } }]
		}
	})
	await expect(request).rejects.toMatchObject({
		name: 'ApiError',
		message: 'Content changed',
		code: 'CONFLICT'
	})
})

test('aborting an idle subscription closes it without waiting for another event', async () => {
	const { iterator } = transport()
	const { Subscribe } = await import('./gql-client')
	const callback = vi.fn()
	const controller = Subscribe.ValuesUpdated({}, callback)
	controller.abort()
	await vi.waitFor(() => expect(iterator.return).toHaveBeenCalledOnce())
	expect(callback).not.toHaveBeenCalled()
})

test('subscriptions deliver data until aborted and discard a queued late event', async () => {
	const { iterator, response } = transport()
	const second = pending()
	iterator.next
		.mockReset()
		.mockReturnValueOnce(response.promise)
		.mockReturnValue(second.promise)
	const { Subscribe } = await import('./gql-client')
	const callback = vi.fn()
	const controller = Subscribe.ValuesUpdated({}, callback)
	response.resolve({
		done: false,
		value: { data: { valuesUpdated: { id: 1 } } }
	})
	await vi.waitFor(() =>
		expect(callback).toHaveBeenCalledWith({ valuesUpdated: { id: 1 } })
	)
	controller.abort()
	second.resolve({ done: false, value: { data: { valuesUpdated: { id: 2 } } } })
	await vi.waitFor(() => expect(iterator.return).toHaveBeenCalledOnce())
	expect(callback).toHaveBeenCalledTimes(1)
})

test('subscription errors are handled without calling consumers with undefined data', async () => {
	const { iterator, response } = transport()
	const log = vi.spyOn(console, 'log').mockImplementation(() => {})
	const { Subscribe } = await import('./gql-client')
	const callback = vi.fn()
	const controller = Subscribe.ValuesUpdated({}, callback)
	response.resolve({
		done: false,
		value: { errors: [{ message: 'Session expired' }] }
	})
	try {
		await vi.waitFor(() => expect(log).toHaveBeenCalled())
		expect(callback).not.toHaveBeenCalled()
		expect(iterator.return).toHaveBeenCalledOnce()
	} finally {
		controller.abort()
	}
})

test('disconnect waits for the WebSocket client to dispose', async () => {
	const { dispose } = transport()
	const { disconnect } = await import('./gql-client')
	await disconnect()
	expect(dispose).toHaveBeenCalledOnce()
})

test('queries and subscriptions carry the tab-selected project, captured before selection changes', async () => {
	const { iterate, response } = transport()
	const { Api, Subscribe, setActiveProjectId } = await import('./gql-client')
	setActiveProjectId(1)
	const request = Api.GetNodes()
	setActiveProjectId(2)
	expect(iterate).toHaveBeenLastCalledWith(
		expect.objectContaining({ extensions: { projectId: 1 } })
	)
	response.resolve({ done: false, value: { data: { getNodes: [] } } })
	await request
	const controller = Subscribe.NodesUpdated({}, vi.fn())
	expect(iterate).toHaveBeenLastCalledWith(
		expect.objectContaining({ extensions: { projectId: 2 } })
	)
	controller.abort()
	setActiveProjectId(undefined)
})
