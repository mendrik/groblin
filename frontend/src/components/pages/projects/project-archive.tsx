import { archiveLimits } from '@shared/project-archive'
import { projectNameSchema } from '@shared/project-roles'
import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadToS3 } from '@/components/ui/zod-form/utils'
import type { PreviewProjectImportQuery } from '@/gql/graphql'
import { Api, setActiveProjectId } from '@/gql-client'
import { $canManage, $projectChanging, requireManage } from '@/state/access'
import {
	loadProject,
	requireSettledEdits,
	stopProjectSubscriptions
} from '@/state/project'
import { hasPendingEdits } from '@/state/save-status'

type Review = {
	key: string
	preview: PreviewProjectImportQuery['previewProjectImport']
}
export function ProjectArchive() {
	const [, navigate] = useLocation()
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string>()
	const [file, setFile] = useState<File>()
	const [review, setReview] = useState<Review>()
	const [name, setName] = useState('')
	const [download, setDownload] = useState<{ url: string; filename: string }>()
	const [needsReview, setNeedsReview] = useState(false)
	const run = async (action: () => Promise<void>) => {
		setBusy(true)
		setError(undefined)
		try {
			requireSettledEdits()
			requireManage()
			await action()
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Archive action failed.'
			)
			setNeedsReview(true)
		} finally {
			setBusy(false)
			$projectChanging.value = false
		}
	}
	const inspect = async (key?: string) => {
		if (!key && !file) throw new Error('Choose a project archive.')
		if (file && file.size > archiveLimits.compressed)
			throw new Error('Project archives can be at most 64 MiB.')
		const uploaded =
			key ?? (file ? await uploadToS3(file, { purpose: 'PROJECT_IMPORT' }) : '')
		const preview = await Api.PreviewProjectImport({ key: uploaded })
		setReview({ key: uploaded, preview })
		setName(preview.name)
		setNeedsReview(false)
	}
	const apply = async () => {
		if (!review || needsReview) return
		const projectName = projectNameSchema.parse(name)
		$projectChanging.value = true
		stopProjectSubscriptions()
		await Api.ImportProjectArchive({
			key: review.key,
			expectedSource: review.preview.source,
			name: projectName
		})
		setActiveProjectId(undefined)
		await loadProject()
		setReview(undefined)
		setFile(undefined)
		navigate('/')
	}
	if (!$canManage.value && !busy) return null
	return (
		<div className="border rounded p-4 my-6 space-y-3">
			<h2>Project archives</h2>
			<p>
				Export the current saved model, content and media. Import creates a new
				project owned by you, ready to review and publish. Accounts, members,
				API keys and revision history are excluded. Use the server backup
				procedure to preserve those.
			</p>
			{error && <p role="alert">{error}</p>}
			<Button
				disabled={busy || hasPendingEdits.value}
				onClick={() =>
					void run(async () => setDownload(await Api.ExportProject()))
				}
			>
				{busy && !review ? 'Working…' : 'Prepare export'}
			</Button>
			{download && (
				<p>
					<a
						className="underline"
						href={download.url}
						download={download.filename}
					>
						Download {download.filename}
					</a>{' '}
					· Link expires after one hour.
				</p>
			)}
			{review ? (
				<div className="space-y-3">
					<p>
						{review.preview.fields} fields · {review.preview.values} values ·{' '}
						{review.preview.mediaFiles} media files (
						{Math.ceil(review.preview.mediaBytes / 1024)} KiB).
					</p>
					<label htmlFor="archive-project-name">New project name</label>
					<Input
						id="archive-project-name"
						value={name}
						onChange={event => setName(event.target.value)}
						maxLength={160}
						disabled={busy}
					/>
					<Button
						disabled={busy || needsReview || hasPendingEdits.value}
						onClick={() => void run(apply)}
					>
						{busy ? 'Importing project…' : 'Confirm new project'}
					</Button>
					<Button
						variant="secondary"
						disabled={busy}
						onClick={() => void run(() => inspect(review.key))}
					>
						Refresh archive review
					</Button>
					<Button
						variant="ghost"
						disabled={busy}
						onClick={() => setReview(undefined)}
					>
						Cancel import
					</Button>
				</div>
			) : (
				<form
					className="space-y-3"
					onSubmit={event => {
						event.preventDefault()
						void run(() => inspect())
					}}
				>
					<label htmlFor="project-archive">
						Import a .groblin.gz project archive
					</label>
					<Input
						id="project-archive"
						type="file"
						accept=".gz,application/gzip"
						required
						disabled={busy}
						onChange={event => setFile(event.target.files?.[0])}
					/>
					<Button type="submit" disabled={busy || hasPendingEdits.value}>
						Review project archive
					</Button>
				</form>
			)}
		</div>
	)
}
