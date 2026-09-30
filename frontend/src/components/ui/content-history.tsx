import { signal, useSignalEffect } from '@preact/signals-react'
import {
	type ContentSnapshot,
	contentSnapshotSchema
} from '@shared/content-snapshot'
import { useState } from 'react'
import type { ContentRevision, GetContentRevisionQuery } from '@/gql/graphql'
import { Api } from '@/gql-client'
import { $canManage } from '@/state/access'
import { loadProject } from '@/state/project'
import { hasPendingEdits } from '@/state/save-status'
import { $focusedNode } from '@/state/tree'
import { $activeListItems } from '@/state/value'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from './dialog'

export const $historyOpen = signal(false)
export const openContentHistory = () => {
	$historyOpen.value = true
}
const message = (error: unknown) =>
	error instanceof Error ? error.message : 'Could not load content history.'
type Selected = GetContentRevisionQuery['getContentRevision'] & {
	parsed: ContentSnapshot
	expectedVersion: number
}

export const ContentHistory = () => {
	const [revisions, setRevisions] = useState<ContentRevision[]>([])
	const [selected, setSelected] = useState<Selected>()
	const [error, setError] = useState<string>()
	const [busy, setBusy] = useState(false)
	const [confirm, setConfirm] = useState(false)
	const [hasMore, setHasMore] = useState(false)
	const historyIsOpen = $historyOpen.value
	useSignalEffect(() => {
		if (!$historyOpen.value) return
		let cancelled = false
		setError(undefined)
		setSelected(undefined)
		setConfirm(false)
		setBusy(true)
		void Api.GetContentRevisions({ limit: 30 })
			.then(rows => {
				if (!cancelled) {
					setRevisions(rows)
					setHasMore(rows.length === 30)
				}
			})
			.catch(error => {
				if (!cancelled) setError(message(error))
			})
			.finally(() => {
				if (!cancelled) setBusy(false)
			})
		return () => {
			cancelled = true
		}
	})
	const select = async (id: number) => {
		setBusy(true)
		setError(undefined)
		setConfirm(false)
		try {
			const [detail, current] = await Promise.all([
				Api.GetContentRevision({ id }),
				Api.GetProject()
			])
			setSelected({
				...detail,
				parsed: contentSnapshotSchema.parse(detail.snapshot),
				expectedVersion: current.project.version
			})
		} catch (error) {
			setError(message(error))
		} finally {
			setBusy(false)
		}
	}
	const more = async () => {
		setBusy(true)
		try {
			const rows = await Api.GetContentRevisions({
				before: revisions[revisions.length - 1]?.version,
				limit: 30
			})
			setRevisions(previous => [...previous, ...rows])
			setHasMore(rows.length === 30)
		} catch (error) {
			setError(message(error))
		} finally {
			setBusy(false)
		}
	}
	const restore = async () => {
		if (!selected || busy || hasPendingEdits.peek() || !$canManage.peek())
			return
		setBusy(true)
		setError(undefined)
		try {
			await Api.RestoreContentRevision({
				id: selected.revision.id,
				expectedVersion: selected.expectedVersion
			})
			$activeListItems.value = {}
			$focusedNode.value = undefined
			await loadProject()
			$historyOpen.value = false
		} catch (error) {
			setError(message(error))
			setConfirm(false)
		} finally {
			setBusy(false)
		}
	}
	const close = () => {
		if (!busy) $historyOpen.value = false
	}
	return (
		<Dialog open={historyIsOpen} onOpenChange={close}>
			<DialogContent
				close={close}
				closeButton={!busy}
				className="max-w-4xl max-h-[85vh] overflow-y-auto"
			>
				<DialogHeader>
					<DialogTitle>Content history</DialogTitle>
					<DialogDescription>
						Review a saved version and restore its complete model, settings and
						content. Restoring creates a new revision.
					</DialogDescription>
				</DialogHeader>
				{error && <p role="alert">{error}</p>}
				{busy && <p role="status">Loading…</p>}
				{hasPendingEdits.value && (
					<p>Save or discard pending edits before restoring a revision.</p>
				)}
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<ol className="space-y-2">
							{revisions.map(revision => (
								<li key={revision.id}>
									<Button
										variant={
											selected?.revision.id === revision.id
												? 'secondary'
												: 'ghost'
										}
										disabled={busy}
										onClick={() => void select(revision.id)}
										className="h-auto w-full text-left justify-start whitespace-normal"
									>
										<div>
											<p>
												Version {revision.version} · {revision.summary}
											</p>
											<p className="text-xs text-muted-foreground">
												{revision.author_name} ·{' '}
												{new Date(revision.created_at).toLocaleString()}
											</p>
										</div>
									</Button>
								</li>
							))}
						</ol>
						{!busy && !revisions.length && (
							<p>History starts with your first content change.</p>
						)}
						{hasMore && (
							<Button
								variant="secondary"
								disabled={busy}
								onClick={() => void more()}
							>
								Load older versions
							</Button>
						)}
					</div>
					{selected && (
						<div className="space-y-3">
							<h3>Version {selected.revision.version}</h3>
							<p>
								{selected.parsed.nodes.length} fields ·{' '}
								{selected.parsed.values.length} values ·{' '}
								{selected.parsed.settings.length} field settings
							</p>
							<details>
								<summary>Review saved content</summary>
								<pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs">
									{JSON.stringify(selected.parsed, null, 2)}
								</pre>
							</details>
							{confirm ? (
								<>
									<p>
										Restore version {selected.revision.version}? This replaces
										the current model, settings and content. Later edits remain
										in history.
									</p>
									<Button
										disabled={
											busy || hasPendingEdits.value || !$canManage.value
										}
										onClick={() => void restore()}
									>
										Confirm restore
									</Button>
									<Button
										variant="secondary"
										disabled={busy}
										onClick={() => setConfirm(false)}
									>
										Cancel
									</Button>
								</>
							) : (
								<Button
									disabled={busy || hasPendingEdits.value || !$canManage.value}
									onClick={() => setConfirm(true)}
								>
									Restore this version
								</Button>
							)}
							<Button
								variant="ghost"
								disabled={busy}
								onClick={() => void select(selected.revision.id)}
							>
								Refresh review
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
