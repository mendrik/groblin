import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { stopPropagation } from '@/lib/dom-events'
import { notNil, setSignal } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { deleteListItem, selectAnyListItem } from '@/state/value'
import { signal } from '@preact/signals-react'
import { pipeTapAsync } from '@shared/utils/pipe-tap-async'
import { pipe } from 'ramda'

export const $deleteListItemOpen = signal(false)
export const $node = signal<TreeNode>()
export const openListItemDelete = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($deleteListItemOpen, true)
}
const close = () => setSignal($deleteListItemOpen, false)

export const deleteTagCommand = () =>
	pipeTapAsync(notNil, deleteListItem, selectAnyListItem)($node)

export const ListItemDelete = () => (
	<AlertDialog open={$deleteListItemOpen.value}>
		<AlertDialogContent onEscapeKeyDown={close} onKeyDown={stopPropagation}>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete this item
					and remove all data associated with it.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
				<AlertDialogAction onClick={pipe(deleteTagCommand, close)} autoFocus>
					Delete
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
