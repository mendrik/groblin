import { computed, signal } from '@preact/signals-react'
import { z } from 'zod'
import type { UpsertValue, Value } from '@/gql/graphql'

const valueInput = z.strictObject({
	id: z.int().positive().nullish(),
	node_id: z.int().positive(),
	expectedRevision: z.int().nonnegative(),
	list_path: z.array(z.int().positive()).nullish(),
	value: z.record(z.string(), z.json())
}) satisfies z.ZodType<UpsertValue>
type EditStatus = 'unsaved' | 'saving' | 'failed' | 'conflict' | 'reviewed'
type VersionedInput = { id?: number | null; expectedRevision: number }
type VersionedResult = { id: number; revision: number }
export type SaveEdit<Input, Result> = {
	key: string
	label: string
	data: Input
	status: EditStatus
	error?: string
	latest?: Result | null
}
type Waiter = {
	resolve: (id: number) => void
	reject: (error: unknown) => void
}
type Dependencies<Input, Result> = {
	input: z.ZodType<Input>
	canRecreate?: boolean
	storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
	key: (data: Input) => string
	send: (data: Input) => Promise<Result>
	read: (data: Input) => Promise<Result | undefined>
	onSaved: (result: Result) => void
}
const conflict = (error: unknown) =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	error.code === 'CONFLICT'
const message = (error: unknown) =>
	error instanceof Error
		? error.message
		: 'Save failed. Your edit is still available.'

/** Serialize saves and retain the exact base version of each local edit until acknowledged. */
export function createSaveQueue<
	Input extends VersionedInput,
	Result extends VersionedResult
>(dependencies: Dependencies<Input, Result>) {
	const recoveredEdit = z.strictObject({
		key: z.string(),
		label: z.string(),
		data: dependencies.input
	})
	const recoveryFile = z.strictObject({
		formatVersion: z.literal(1),
		edits: z.array(recoveredEdit)
	})
	const edits = signal<SaveEdit<Input, Result>[]>([])
	const storageError = signal<string>()
	const busy = signal(false)
	const savedAt = signal<Date>()
	const hasPending = computed(() => edits.value.length > 0)
	const waiters = new Map<string, Waiter[]>()
	let scope: string | undefined
	let recoveryLocked = false
	const replace = (
		key: string,
		change: (edit: SaveEdit<Input, Result>) => SaveEdit<Input, Result>
	) => {
		edits.value = edits
			.peek()
			.map(edit => (edit.key === key ? change(edit) : edit))
	}
	const persist = () => {
		if (!scope || recoveryLocked) return
		try {
			if (edits.peek().length)
				dependencies.storage.setItem(
					scope,
					JSON.stringify({
						formatVersion: 1,
						edits: edits
							.peek()
							.map(({ key, label, data }) => ({ key, label, data }))
					})
				)
			else dependencies.storage.removeItem(scope)
			storageError.value = undefined
		} catch {
			storageError.value =
				'Local recovery could not be stored. Keep this tab open until your edits are saved.'
		}
	}
	const settle = (key: string, result: number | { error: unknown }) => {
		for (const waiter of waiters.get(key) ?? [])
			typeof result === 'number'
				? waiter.resolve(result)
				: waiter.reject(result.error)
		waiters.delete(key)
	}
	const stage = (data: Input, label: string) => {
		const parsed = dependencies.input.parse(data)
		const key = dependencies.key(parsed)
		const previous = edits.peek().find(edit => edit.key === key)
		const next: SaveEdit<Input, Result> = previous
			? {
					...previous,
					label,
					data: {
						...parsed,
						id: previous.data.id,
						expectedRevision: previous.data.expectedRevision
					}
				}
			: { key, label, data: parsed, status: 'unsaved' }
		edits.value = [...edits.peek().filter(edit => edit.key !== key), next]
		persist()
		return key
	}
	const flush = async (): Promise<void> => {
		if (busy.peek()) return
		busy.value = true
		try {
			while (true) {
				const edit = edits.peek().find(edit => edit.status === 'saving')
				if (!edit) break
				const submitted = edit.data
				try {
					const saved = await dependencies.send(submitted)
					dependencies.onSaved(saved)
					savedAt.value = new Date()
					const current = edits.peek().find(item => item.key === edit.key)
					if (current?.data !== submitted) {
						replace(edit.key, item => ({
							...item,
							data: {
								...item.data,
								id: saved.id,
								expectedRevision: saved.revision
							}
						}))
					} else {
						edits.value = edits.peek().filter(item => item.key !== edit.key)
						settle(edit.key, saved.id)
					}
				} catch (error) {
					replace(edit.key, item => ({
						...item,
						status: conflict(error) ? 'conflict' : 'failed',
						error: message(error)
					}))
					settle(edit.key, { error })
				}
				persist()
			}
		} finally {
			busy.value = false
		}
	}
	const save = (data: Input, label: string) => {
		const key = stage(data, label)
		const edit = edits.peek().find(item => item.key === key)
		if (edit?.status === 'conflict' || edit?.status === 'reviewed')
			return Promise.reject(
				new Error('Review the conflict before saving this edit.')
			)
		replace(key, edit => ({ ...edit, status: 'saving', error: undefined }))
		const result = new Promise<number>((resolve, reject) => {
			waiters.set(key, [...(waiters.get(key) ?? []), { resolve, reject }])
		})
		void flush()
		return result
	}
	const retry = (key: string) => {
		const edit = edits.peek().find(item => item.key === key)
		if (!edit || ['saving', 'conflict', 'reviewed'].includes(edit.status))
			return
		void save(edit.data, edit.label).catch(() => {})
	}
	const review = async (key: string) => {
		const edit = edits.peek().find(item => item.key === key)
		if (!edit || edit.status === 'saving') return
		try {
			const latest = await dependencies.read(edit.data)
			replace(key, item => ({
				...item,
				latest: latest ?? null,
				status: 'reviewed',
				error: undefined
			}))
		} catch (error) {
			replace(key, item => ({ ...item, error: message(error) }))
		}
	}
	const keepMine = (key: string) => {
		const edit = edits.peek().find(item => item.key === key)
		if (edit?.status !== 'reviewed') return
		if (!edit.latest && dependencies.canRecreate === false) {
			replace(key, item => ({
				...item,
				error:
					'This field was deleted. Restore it from content history before applying this edit.'
			}))
			return
		}
		replace(key, item => ({
			...item,
			status: 'unsaved',
			latest: undefined,
			data: {
				...item.data,
				id: edit.latest?.id,
				expectedRevision: edit.latest?.revision ?? 0
			}
		}))
		persist()
		retry(key)
	}
	const discard = (key: string) => {
		const edit = edits.peek().find(item => item.key === key)
		if (!edit || edit.status === 'saving') return
		if (edit.latest) dependencies.onSaved(edit.latest)
		edits.value = edits.peek().filter(item => item.key !== key)
		settle(key, { error: new Error('Edit discarded') })
		persist()
	}
	const configure = (projectId: number, userId: string, kind = 'values') => {
		const nextScope = `groblin:pending-${kind}:${encodeURIComponent(userId)}:${projectId}`
		if (scope === nextScope) return
		if (busy.peek())
			throw new Error('Wait for pending saves before switching projects.')
		persist()
		scope = nextScope
		recoveryLocked = false
		storageError.value = undefined
		edits.value = []
		try {
			const raw = dependencies.storage.getItem(scope)
			if (raw)
				edits.value = recoveryFile.parse(JSON.parse(raw)).edits.map(edit => ({
					...edit,
					status: 'failed',
					error: 'Recovered an unconfirmed edit. Review or retry it.'
				}))
		} catch {
			recoveryLocked = true
			storageError.value =
				'Stored edits could not be loaded and have been preserved. Keep this tab open until new edits are saved.'
		}
	}
	return {
		edits,
		busy,
		savedAt,
		hasPending,
		storageError,
		configure,
		stage,
		save,
		retry,
		review,
		keepMine,
		discard
	}
}

export const createValueSaveQueue = (
	dependencies: Omit<Dependencies<UpsertValue, Value>, 'input'>
) => createSaveQueue({ ...dependencies, input: valueInput })
