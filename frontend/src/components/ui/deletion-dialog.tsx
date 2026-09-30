import { useEffect } from 'react'
import { DeletionKind } from '@/gql/graphql'
import {
	$deleting,
	$deletion,
	$deletionError,
	$deletionImpact,
	$previewLoading,
	cancelDeletion,
	confirmDeletion,
	refreshDeletionPreview
} from '@/state/deletion'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from './alert-dialog'
import { Button } from './button'

export function DeletionDialog() {
	useEffect(() => () => cancelDeletion(), [])
	const request = $deletion.value
	const impact = $deletionImpact.value
	const busy = $deleting.value
	return (
		<AlertDialog
			open={!!request}
			onOpenChange={open => {
				if (!open) cancelDeletion()
			}}
		>
			<AlertDialogContent
				onEscapeKeyDown={event => {
					if (busy) event.preventDefault()
					else cancelDeletion()
				}}
			>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{request?.target.kind === DeletionKind.NodeValues
							? 'Clear content'
							: 'Delete content'}
						{impact ? `: ${impact.name}` : ''}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Review what will be removed before confirming.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{$previewLoading.value && (
					<p role="status">Loading affected content…</p>
				)}
				{impact && (
					<div className="space-y-2">
						<p>
							{impact.fields} fields, {impact.values} stored values,{' '}
							{impact.listItems} list items and {impact.mediaFiles} media files
							will be removed.
						</p>
						{impact.fieldNames.length > 0 && (
							<p className="text-sm text-muted-foreground">
								Fields: {impact.fieldNames.join(', ')}
								{impact.fields > impact.fieldNames.length ? ', …' : ''}
							</p>
						)}
						<p className="text-sm text-muted-foreground">
							This also removes content inside affected list items.
						</p>
					</div>
				)}
				{$deletionError.value && (
					<p role="alert" className="text-destructive">
						{$deletionError.value}
					</p>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={busy} onClick={cancelDeletion}>
						Cancel
					</AlertDialogCancel>
					{!impact && !$previewLoading.value && (
						<Button
							variant="outline"
							onClick={() => void refreshDeletionPreview()}
						>
							Retry preview
						</Button>
					)}
					<Button
						variant="destructive"
						disabled={!impact || busy || $previewLoading.value}
						onClick={() => void confirmDeletion()}
					>
						{busy ? 'Deleting…' : 'Delete'}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
