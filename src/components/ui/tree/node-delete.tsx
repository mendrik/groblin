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
import { pipeAsync } from '@/lib/pipeAsync'
import { setSignal } from '@/lib/utils'
import {
	deleteNode,
	focusNode,
	focusedNode,
	node,
	previousNode,
	waitForUpdate
} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { F, pipe, tap } from 'ramda'

export const $deleteDialogOpen = signal(false)
const close = pipe(F, setSignal($deleteDialogOpen))

export const deleteNodeCommand = pipeAsync(
	focusedNode,
	tap(x => console.log('deleting node', node(x).name)),
	deleteNode,
	waitForUpdate,
	previousNode,
	focusNode
)

export const NodeDelete = () => (
	<AlertDialog open={$deleteDialogOpen.value}>
		<AlertDialogContent
			className="border-muted-foreground"
			onEscapeKeyDown={close}
			onKeyDown={stopPropagation}
		>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete this node
					and remove all data associated with it.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
				<AlertDialogAction onClick={pipe(deleteNodeCommand, close)} autoFocus>
					Continue
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
