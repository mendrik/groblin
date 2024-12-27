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
import { setSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import type { TreeNode } from '@/state/tree'
import { deleteListItem, selectAnyListItem } from '@/state/value'
import { signal } from '@preact/signals-react'
import { pipeTap } from '@shared/utils/pipe-tap'
import { pipe } from 'ramda'
import { delayP } from 'ramda-adjunct'

export const $deleteListItemOpen = signal(false)
export const $node = signal<TreeNode>()
export const openListItemDelete = (node: TreeNode) => {
	setSignal($node, node)
	setSignal($deleteListItemOpen, true)
}
const close = () => setSignal($deleteListItemOpen, false)

export const deleteTagCommand = () =>
	pipeTap(deleteListItem, x => delayP(100), selectAnyListItem)(notNil($node))

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
