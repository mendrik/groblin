import { signal, useSignalEffect } from '@preact/signals-react'
import { jsonImportInputSchema } from '@shared/imports'
import { useState } from 'react'
import {
	ImportKind,
	type JsonArrayImportInput,
	type PreviewImportQuery
} from '@/gql/graphql'
import { Api } from '@/gql-client'
import { $canManage, $projectChanging, requireEdit } from '@/state/access'
import { loadProject, requireSettledEdits } from '@/state/project'
import type { TreeNode } from '@/state/tree'
import { activePath } from '@/state/value'
import { Button } from '../button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '../dialog'
import { Input } from '../input'
import { uploadToS3 } from '../zod-form/utils'

const $target = signal<{ node: TreeNode; kind: ImportKind }>()
export const openContentImport = (node: TreeNode, kind: ImportKind) => {
	requireEdit()
	requireSettledEdits()
	$target.value = { node, kind }
}
type Review = {
	data: JsonArrayImportInput
	preview: PreviewImportQuery['previewImport']
}

export const ContentImportDialog = () => {
	const [file, setFile] = useState<File>()
	const [structure, setStructure] = useState(false)
	const [externalId, setExternalId] = useState('')
	const [review, setReview] = useState<Review>()
	const [error, setError] = useState<string>()
	const [busy, setBusy] = useState(false)
	const [needsReview, setNeedsReview] = useState(false)
	useSignalEffect(() => {
		if (!$target.value) return
		setFile(undefined)
		setReview(undefined)
		setError(undefined)
		setExternalId('')
		setStructure($canManage.peek())
		setNeedsReview(false)
	})
	const close = () => {
		if (!busy) $target.value = undefined
	}
	const inspect = async (previous?: JsonArrayImportInput) => {
		setBusy(true)
		setError(undefined)
		try {
			requireSettledEdits()
			const target = $target.peek()
			if (!target) throw new Error('Choose an import target.')
			if (!previous && !file) throw new Error('Choose a JSON file.')
			if (file && file.size > 10 * 1024 * 1024)
				throw new Error('JSON imports can be at most 10 MiB.')
			const data =
				previous ??
				jsonImportInputSchema.parse({
					node_id: target.node.id,
					data: file ? await uploadToS3(file, { purpose: 'JSON_IMPORT' }) : '',
					structure: $canManage.peek() && structure,
					external_id: externalId.trim() || undefined,
					list_path: activePath(target.node)
				})
			const preview = await Api.PreviewImport({ data, kind: target.kind })
			setReview({ data, preview })
			setNeedsReview(false)
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Import review failed.')
			setNeedsReview(true)
		} finally {
			setBusy(false)
		}
	}
	const apply = async () => {
		if (!review || needsReview) return
		setBusy(true)
		setError(undefined)
		try {
			requireSettledEdits()
			requireEdit()
			$projectChanging.value = true
			const variables = {
				data: review.data,
				expectedVersion: review.preview.version,
				expectedSource: review.preview.source
			}
			if ($target.peek()?.kind === ImportKind.Array)
				await Api.ImportArray(variables)
			else await Api.ImportObject(variables)
			await loadProject()
			$target.value = undefined
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Import failed.')
			setNeedsReview(true)
		} finally {
			$projectChanging.value = false
			setBusy(false)
		}
	}
	return (
		<Dialog open={$target.value !== undefined} onOpenChange={close}>
			<DialogContent close={close} closeButton={!busy}>
				<DialogHeader>
					<DialogTitle>Import JSON into {$target.value?.node.name}</DialogTitle>
					<DialogDescription>
						Review model and content changes before applying. The previous
						content is kept in history.
					</DialogDescription>
				</DialogHeader>
				{error && <p role="alert">{error}</p>}
				{review ? (
					<div className="space-y-3">
						<p>
							{review.preview.fieldsAdded} fields added ·{' '}
							{review.preview.valuesAdded} values added ·{' '}
							{review.preview.valuesChanged} values changed ·{' '}
							{review.preview.valuesRemoved} values removed.
						</p>
						<p>
							Matching external IDs update existing items. Nested arrays in
							those items are replaced by the imported arrays.
						</p>
						<Button disabled={busy || needsReview} onClick={() => void apply()}>
							{busy ? 'Importing…' : 'Confirm import'}
						</Button>
						<Button
							variant="secondary"
							disabled={busy}
							onClick={() => void inspect(review.data)}
						>
							Refresh review
						</Button>
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => {
								setReview(undefined)
								setNeedsReview(false)
							}}
						>
							Choose another file
						</Button>
					</div>
				) : (
					<form
						className="space-y-3"
						onSubmit={event => {
							event.preventDefault()
							void inspect()
						}}
					>
						<label htmlFor="import-file">JSON file</label>
						<Input
							id="import-file"
							type="file"
							accept=".json,application/json"
							required
							disabled={busy}
							onChange={event => setFile(event.target.files?.[0])}
						/>
						{$target.value?.kind === ImportKind.Array && (
							<>
								<label htmlFor="import-id">External ID field (optional)</label>
								<Input
									id="import-id"
									value={externalId}
									maxLength={128}
									onChange={event => setExternalId(event.target.value)}
									disabled={busy}
								/>
							</>
						)}
						{$canManage.value && (
							<label className="flex gap-2">
								<input
									type="checkbox"
									checked={structure}
									disabled={busy}
									onChange={event => setStructure(event.target.checked)}
								/>
								Create missing fields
							</label>
						)}
						<Button type="submit" disabled={busy}>
							{busy ? 'Reviewing…' : 'Review import'}
						</Button>
					</form>
				)}
				<Button variant="secondary" disabled={busy} onClick={close}>
					Cancel
				</Button>
			</DialogContent>
		</Dialog>
	)
}
