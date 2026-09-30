import { useSignalEffect } from '@preact/signals-react'
import {
	type ContentSnapshot,
	contentSnapshotSchema
} from '@shared/content-snapshot'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GetPublicationQuery } from '@/gql/graphql'
import { Api } from '@/gql-client'
import { $canManage } from '@/state/access'
import { $project } from '@/state/project'
import { hasPendingEdits } from '@/state/save-status'
import { Page } from '../page'

type Status = GetPublicationQuery['getPublication']
type Review = {
	status: Status
	snapshot: ContentSnapshot
	revisionId: number
	rollback: boolean
}
export function Publication() {
	const [status, setStatus] = useState<Status>()
	const [review, setReview] = useState<Review>()
	const [confirm, setConfirm] = useState(false)
	const [error, setError] = useState<string>()
	const [busy, setBusy] = useState(false)
	useSignalEffect(() => {
		if (!$project.value) return
		let active = true
		void Api.GetPublication()
			.then(status => {
				if (active) setStatus(status)
			})
			.catch(error => {
				if (active)
					setError(
						error instanceof Error
							? error.message
							: 'Could not load publication.'
					)
			})
		return () => {
			active = false
		}
	})
	const inspect = async (revisionId?: number) => {
		setBusy(true)
		setError(undefined)
		setConfirm(false)
		try {
			const current = await Api.GetPublication()
			const latest =
				revisionId ?? (await Api.GetContentRevisions({ limit: 1 }))[0]?.id
			if (!latest) throw new Error('Save content before publishing.')
			const detail = await Api.GetContentRevision({ id: latest })
			if (
				revisionId === undefined &&
				detail.revision.version !== current.draftVersion
			)
				throw new Error('The draft changed during review. Review it again.')
			setStatus(current)
			setReview({
				status: current,
				revisionId: latest,
				snapshot: contentSnapshotSchema.parse(detail.snapshot),
				rollback: revisionId !== undefined
			})
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Could not review content.'
			)
		} finally {
			setBusy(false)
		}
	}
	const publish = async () => {
		if (!review || hasPendingEdits.peek() || !$canManage.peek()) return
		setBusy(true)
		setError(undefined)
		try {
			await Api.PublishContent({
				expectedVersion: review.status.draftVersion,
				expectedPublication: review.status.history[0]?.id ?? 0,
				revisionId: review.revisionId
			})
			setStatus(await Api.GetPublication())
			setReview(undefined)
			setConfirm(false)
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Publication failed.')
			setConfirm(false)
		} finally {
			setBusy(false)
		}
	}
	return (
		<Page>
			<h1>Publication</h1>
			<p>
				Your website receives the last published model and content. The editor
				and preview keys show saved drafts.
			</p>
			{error && <p role="alert">{error}</p>}
			{status && (
				<p>
					Draft version {status.draftVersion} ·{' '}
					{status.current
						? `Published version ${status.current.version}`
						: 'Not published yet'}
				</p>
			)}
			{hasPendingEdits.value && (
				<p>Save or resolve pending edits before publishing.</p>
			)}
			{$canManage.value && (
				<Button
					disabled={busy || hasPendingEdits.value}
					onClick={() => void inspect()}
				>
					Review draft for publication
				</Button>
			)}
			{review && (
				<div className="border rounded p-4 my-4 space-y-3">
					<h2>
						{review.rollback ? 'Roll back publication' : 'Publish draft'} ·
						version {review.snapshot.project.version}
					</h2>
					<p>
						{review.snapshot.nodes.length} fields and{' '}
						{review.snapshot.values.length} values will be available to the
						website.
					</p>
					{review.rollback && (
						<p>
							This replaces the published version. Your current draft stays
							unchanged.
						</p>
					)}
					<details>
						<summary>Inspect content</summary>
						<pre className="text-xs max-h-64 overflow-auto whitespace-pre-wrap break-all">
							{JSON.stringify(review.snapshot, null, 2)}
						</pre>
					</details>
					{confirm ? (
						<>
							<p>Make this version available to the website now?</p>
							<Button
								disabled={busy || hasPendingEdits.value || !$canManage.value}
								onClick={() => void publish()}
							>
								{busy ? 'Publishing…' : 'Confirm publication'}
							</Button>
						</>
					) : (
						<Button
							disabled={busy || hasPendingEdits.value || !$canManage.value}
							onClick={() => setConfirm(true)}
						>
							Continue
						</Button>
					)}
					<Button
						variant="secondary"
						disabled={busy}
						onClick={() => {
							setReview(undefined)
							setConfirm(false)
						}}
					>
						Cancel
					</Button>
					<Button
						variant="ghost"
						disabled={busy}
						onClick={() =>
							void inspect(review.rollback ? review.revisionId : undefined)
						}
					>
						Refresh review
					</Button>
				</div>
			)}
			<h2>Publication history</h2>
			<ul className="space-y-2">
				{status?.history.map(item => (
					<li key={item.id}>
						<p>
							Version {item.version} · {item.summary} · {item.author_name} ·{' '}
							{new Date(item.created_at).toLocaleString()}
						</p>
						{$canManage.value && item.id !== status.current?.id && (
							<Button
								variant="secondary"
								disabled={busy || hasPendingEdits.value}
								onClick={() => void inspect(item.revision_id)}
							>
								Review version {item.version}
							</Button>
						)}
					</li>
				))}
			</ul>
		</Page>
	)
}
