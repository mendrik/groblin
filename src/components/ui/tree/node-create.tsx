import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/utils'
import {} from '@/state/tree'
import { signal } from '@preact/signals-react'
import { F, T, pipe } from 'ramda'
import { Button } from '../button'

export const $createDialogOpen = signal(false)
export const $createNodePosition = signal<
	'child' | 'sibling-above' | 'sibling-below'
>('child')
const close = pipe(F, setSignal($createDialogOpen))
export const openNodeCreate = pipe(
	setSignal($createNodePosition),
	T,
	setSignal($createDialogOpen)
)

export const NodeCreate = () => (
	<Dialog open={$createDialogOpen.value}>
		<DialogContent
			className="border-muted-foreground"
			onEscapeKeyDown={close}
			onInteractOutside={close}
		>
			<DialogHeader>
				<DialogTitle>Create node</DialogTitle>
				<DialogDescription>
					Please select the type of node you want to add to the tree at the
					specified location.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button onClick={close} variant="secondary">
					Cancel
				</Button>
				<Button type="submit">Create</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)
