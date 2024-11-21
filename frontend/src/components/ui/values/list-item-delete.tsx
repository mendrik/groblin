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
import { setSignal } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { deleteListItem } from '@/state/value'
import { signal } from '@preact/signals-react'
import { pipe } from 'ramda'

export const $deleteListItemOpen = signal(false)
export const $node = signal<TreeNode>()
export const openListItemDelete = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($deleteListItemOpen, true)
}
const close = () => setSignal($deleteListItemOpen, false)

export const deleteTagCommand = () => deleteListItem($node)

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
					Continue
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
