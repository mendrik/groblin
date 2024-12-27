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
import { type TreeNode, focusNode, updateNodeContext } from '@/state/tree'
import { truncateList } from '@/state/value'
import { signal } from '@preact/signals-react'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'

export const $node = signal<TreeNode>()
export const $truncateDialogOpen = signal(false)
export const openNodeTruncate: (n: TreeNode) => void = pipe(
	setSignal($node),
	T,
	setSignal($truncateDialogOpen)
)

const close = pipe(F, setSignal($truncateDialogOpen))

export const truncateNodeCommand = pipeAsync(
	() => notNil($node),
	truncateList,
	focusNode,
	updateNodeContext
)

export const NodeTruncate = () => (
	<AlertDialog open={$truncateDialogOpen.value}>
		<AlertDialogContent onEscapeKeyDown={close} onKeyDown={stopPropagation}>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete all items
					from the list.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
				<AlertDialogAction onClick={pipe(truncateNodeCommand, close)} autoFocus>
					Continue
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
