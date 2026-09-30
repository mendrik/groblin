import { signal } from '@preact/signals-react'
import type { DeletionImpact, DeletionTarget } from '@/gql/graphql'
import { Api } from '@/gql-client'

type Request = {
	target: DeletionTarget
	perform: (fingerprint: string) => Promise<unknown>
	resolve: (deleted: boolean) => void
}
export const $deletion = signal<Request>()
export const $deletionImpact = signal<DeletionImpact>()
export const $deletionError = signal<string>()
export const $deleting = signal(false)
export const $previewLoading = signal(false)

const message = (error: unknown) =>
	error instanceof Error
		? error.message
		: Array.isArray(error) && error.every(item => typeof item === 'string')
			? error.join('. ')
			: 'Deletion failed. Please try again.'

export async function refreshDeletionPreview(preserveError = false) {
	const request = $deletion.peek()
	if (!request) return
	if (!preserveError) $deletionError.value = undefined
	$previewLoading.value = true
	$deletionImpact.value = undefined
	try {
		const impact = await Api.GetDeletionImpact({ target: request.target })
		if ($deletion.peek() === request) $deletionImpact.value = impact
	} catch (error) {
		if ($deletion.peek() === request) $deletionError.value = message(error)
	} finally {
		if ($deletion.peek() === request) $previewLoading.value = false
	}
}

export function cancelDeletion() {
	if ($deleting.peek()) return
	const request = $deletion.peek()
	$deletion.value = undefined
	$deletionImpact.value = undefined
	$deletionError.value = undefined
	request?.resolve(false)
}

export function requestDeletion(
	target: DeletionTarget,
	perform: Request['perform']
): Promise<boolean> {
	if ($deleting.peek()) return Promise.resolve(false)
	cancelDeletion()
	return new Promise(resolve => {
		$deletion.value = { target, perform, resolve }
		void refreshDeletionPreview()
	})
}

export async function confirmDeletion() {
	const request = $deletion.peek()
	const impact = $deletionImpact.peek()
	if (!request || !impact || $deleting.peek() || $previewLoading.peek()) return
	$deleting.value = true
	$deletionError.value = undefined
	try {
		await request.perform(impact.fingerprint)
		$deletion.value = undefined
		$deletionImpact.value = undefined
		request.resolve(true)
	} catch (error) {
		$deletionError.value = message(error)
		await refreshDeletionPreview(true)
	} finally {
		$deleting.value = false
	}
}
