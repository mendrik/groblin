import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { useFormState } from '@/components/ui/zod-form/use-form-state'
import { asField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { setSignal } from '@/lib/signals'
import { inviteUser } from '@/state/users'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from 'matchblade'
import { F, pipe } from 'ramda'
import { type TypeOf, strictObject, string } from 'zod'

const $dialogOpen = signal(false)

export const openUserInvite = () => {
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

const invitationSchema = strictObject({
	email: asField(string(), {
		label: 'Email',
		editor: EditorType.Input,
		description: 'Enter the user email'
	})
})

export type InvitationSchema = TypeOf<typeof invitationSchema>

const inviteUserCommand: (data: InvitationSchema) => Promise<any> =
	pipeAsync(inviteUser)

export const UserInvite = () => {
	const [formApi, ref] = useFormState<InvitationSchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Invite user</DialogTitle>
					<DialogDescription>
						Allows to invite users to this project.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={invitationSchema}
					onSubmit={pipe(inviteUserCommand, close)}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
