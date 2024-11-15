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
import {
	deleteNode,
	focusNode,
	focusedNode,
	previousNode,
	updateNodeContext
} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'

export const $deleteDialogOpen = signal(false)
export const openNodeDelete = pipe(T, setSignal($deleteDialogOpen))

const close = pipe(F, setSignal($deleteDialogOpen))

export const deleteNodeCommand = pipeAsync(
	focusedNode,
	deleteNode,
	previousNode,
	focusNode,
	updateNodeContext
)

export const NodeDelete = () => (
	<AlertDialog open={$deleteDialogOpen.value}>
		<AlertDialogContent onEscapeKeyDown={close} onKeyDown={stopPropagation}>
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
