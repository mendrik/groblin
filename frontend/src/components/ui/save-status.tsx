import { signal } from '@preact/signals-react'
import { useEffect } from 'react'
import { contentSaveQueues, hasPendingEdits } from '@/state/save-status'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from './dialog'

export const $saveStatusOpen = signal(false)
export const openSaveStatus = () => {
	$saveStatusOpen.value = true
}
const display = (data: unknown) => {
	if (typeof data !== 'object' || data === null) return data
	if ('value' in data) return data.value
	if ('settings' in data) return data.settings
	if ('name' in data) return data.name
	return data
}
export const SaveStatus = () => {
	const open = $saveStatusOpen.value
	const setOpen = (open: boolean) => {
		$saveStatusOpen.value = open
	}
	const pending = hasPendingEdits.value
	const edits = contentSaveQueues.flatMap(queue =>
		queue.edits.value.map(edit => ({
			...edit,
			retry: () => queue.retry(edit.key),
			review: () => queue.review(edit.key),
			keepMine: () => queue.keepMine(edit.key),
			discard: () => queue.discard(edit.key)
		}))
	)
	const saving = contentSaveQueues.some(queue => queue.busy.value)
	useEffect(() => {
		const protect = (event: BeforeUnloadEvent) => {
			if (!hasPendingEdits.peek()) return
			event.preventDefault()
			event.returnValue = ''
		}
		window.addEventListener('beforeunload', protect)
		return () => window.removeEventListener('beforeunload', protect)
	}, [])
	const status = saving
		? 'Saving…'
		: contentSaveQueues.some(queue => queue.storageError.value)
			? 'Recovery needs attention'
			: edits.some(edit => ['conflict', 'reviewed'].includes(edit.status))
				? 'Conflict needs review'
				: edits.some(edit => edit.status === 'failed')
					? 'Save failed'
					: pending
						? 'Unsaved changes'
						: 'All changes saved'
	return (
		<>
			<div className="fixed bottom-3 right-3 z-40 rounded border bg-background p-2 text-sm shadow">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setOpen(true)}
					aria-haspopup="dialog"
					aria-label={status}
				>
					<span role="status">{status}</span>
				</Button>
			</div>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					close={() => setOpen(false)}
					className="max-w-3xl max-h-[85vh] overflow-y-auto"
				>
					<DialogHeader>
						<DialogTitle>Save status</DialogTitle>
						<DialogDescription>
							Edits stay in this browser until the server confirms them. Review
							a conflict before choosing which version to keep.
						</DialogDescription>
					</DialogHeader>
					{contentSaveQueues.map(
						queue =>
							queue.storageError.value && (
								<p key={queue.name} role="alert">
									{queue.storageError.value}
								</p>
							)
					)}
					{!pending && <p>All changes saved.</p>}
					{edits.map(edit => (
						<section
							key={`${edit.key}:${edit.label}`}
							className="space-y-3 rounded border p-3"
						>
							<h3 className="font-medium">{edit.label}</h3>
							<p>
								{edit.status === 'saving'
									? 'Saving…'
									: (edit.error ?? 'Your edit has not been saved.')}
							</p>
							<div className="grid gap-3 sm:grid-cols-2">
								<div>
									<h4>Your edit</h4>
									<pre className="text-xs whitespace-pre-wrap break-all">
										{JSON.stringify(display(edit.data), null, 2)}
									</pre>
								</div>
								{edit.status === 'reviewed' && (
									<div>
										<h4>Latest saved version</h4>
										<pre className="text-xs whitespace-pre-wrap break-all">
											{edit.latest
												? JSON.stringify(display(edit.latest), null, 2)
												: 'This item no longer exists.'}
										</pre>
									</div>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								{['unsaved', 'failed'].includes(edit.status) && (
									<Button size="sm" onClick={() => edit.retry()}>
										Retry save
									</Button>
								)}
								{edit.status !== 'saving' && (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => void edit.review()}
									>
										Review latest
									</Button>
								)}
								{edit.status === 'reviewed' && (
									<Button size="sm" onClick={() => edit.keepMine()}>
										Save my edit
									</Button>
								)}
								{edit.status !== 'saving' && (
									<Button
										size="sm"
										variant="secondary"
										onClick={() => edit.discard()}
									>
										{edit.status === 'reviewed'
											? 'Use saved version'
											: 'Discard my edit'}
									</Button>
								)}
							</div>
						</section>
					))}
				</DialogContent>
			</Dialog>
		</>
	)
}
