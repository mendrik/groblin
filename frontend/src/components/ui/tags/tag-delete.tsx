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
import type { Tag } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { notNil, setSignal } from '@/lib/utils'
import { deleteTag } from '@/state/tag'
import { signal } from '@preact/signals-react'
import { F, T, pipe } from 'ramda'

export const $editedTag = signal<Tag>()
export const $deleteDialogOpen = signal(false)
const close = pipe(F, setSignal($deleteDialogOpen))
export const openTagDelete = pipe(
	setSignal($editedTag),
	T,
	setSignal($deleteDialogOpen)
)

export const deleteTagCommand = () => deleteTag(notNil($editedTag).id)

export const TagDelete = () => (
	<AlertDialog open={$deleteDialogOpen.value}>
		<AlertDialogContent onEscapeKeyDown={close} onKeyDown={stopPropagation}>
			<AlertDialogHeader>
				<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete this tag
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
