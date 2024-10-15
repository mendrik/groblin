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
import { setSignal } from '@/lib/utils'
import { signal } from '@preact/signals-react'
import { F, pipe } from 'ramda'

export const $deleteDialogOpen = signal(false)

export const NodeDelete = () => (
	<AlertDialog open={$deleteDialogOpen.value}>
		<AlertDialogContent className="border-muted-foreground">
			<AlertDialogHeader>
				<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete this node
					and remove all data associated with it.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel onClick={pipe(F, setSignal($deleteDialogOpen))}>
					Cancel
				</AlertDialogCancel>
				<AlertDialogAction>Continue</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
)
