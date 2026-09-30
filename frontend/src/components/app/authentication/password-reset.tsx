import { EditorType } from '@shared/enums'
import { toast } from 'sonner'
import { strictObject, type TypeOf } from 'zod/v4'
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
import { disconnect } from '@/gql-client'
import { dataOrError, resetPassword } from '@/lib/auth-client'

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

const resetPasswordCommand = async ({ password }: ResetPassword) => {
	const token = new URLSearchParams(window.location.search).get('token')
	if (!token) throw new Error('This reset link is invalid. Request a new one.')
	dataOrError(await resetPassword({ newPassword: password, token }))
	toast.success('Password reset. Sign in with your new password.')
	await disconnect()
	window.location.replace('/')
}

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
					onSubmit={resetPasswordCommand}
					onError={error => toast.error(error.message)}
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
