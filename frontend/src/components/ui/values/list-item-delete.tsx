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
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { notNil, setSignal } from '@/lib/signals'
import { deleteListItem, selectAnyListItem } from '@/state/value'
import { signal } from '@preact/signals-react'
import { pipeTap } from 'matchblade'
import { T, pipe } from 'ramda'

export const $deleteListItemOpen = signal(false)
export const $value = signal<Value>()
export const openListItemDelete: (value: Value) => unknown = pipe(
	setSignal($value),
	T,
	setSignal($deleteListItemOpen)
)

const close = () => setSignal($deleteListItemOpen, false)

export const deleteTagCommand = () =>
	pipeTap(deleteListItem, selectAnyListItem)(notNil($value))

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
