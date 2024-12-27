import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeTap } from '@shared/utils/pipe-tap'
import type { Fn } from '@tp/functions.ts'
import { pipe } from 'ramda'
import { toast } from 'sonner'
import { type TypeOf, strictObject } from 'zod'

const resetPasswordSchema = strictObject({
	password: stringField('Password', EditorType.Password, 'new-password'),
	repeatPassword: stringField(
		'Repeat password',
		EditorType.Password,
		'new-password'
	)
}).refine(data => data.password === data.repeatPassword, {
	message: 'Passwords must match',
	path: ['repeatPassword']
})

type ResetPassword = TypeOf<typeof resetPasswordSchema>

const $locked = signal(false)
const lockForm = () => setSignal($locked, true)

const success = () =>
	toast.success('Successfully registered', {
		description: 'Check your email for a confirmation link',
		closeButton: true
	})

const resetPasswordCommand: Fn<Partial<ResetPassword>, void> = pipeTap(
	console.log // todo,
)

export const PasswordResetDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent className="max-w-sm" close={close}>
				<DialogHeader>
					<DialogTitle>Reset your password</DialogTitle>
					<DialogDescription>
						Please enter your new password and repeat it in the field below.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={resetPasswordSchema}
					onSubmit={pipe(resetPasswordCommand)}
				>
					<DialogFooter className="gap-2 flex flex-row items-center">
						<Button type="submit" className="ml-auto">
							Reset password
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
