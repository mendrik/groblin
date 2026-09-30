import { EditorType } from '@shared/enums'
import { toast } from 'sonner'
import { Link } from 'wouter'
import { navigate } from 'wouter/use-browser-location'
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
import { dataOrError, requestPasswordReset } from '@/lib/auth-client'

const forgotPasswordSchema = strictObject({
	email: stringField('Email', EditorType.Email, 'username')
})

type ForgotPassword = TypeOf<typeof forgotPasswordSchema>

const success = () =>
	toast.success('Check your email', {
		description:
			'If an account exists for this email, you will receive a password reset link.',
		closeButton: true
	})

const forgotPasswordCommand = async ({ email }: ForgotPassword) => {
	dataOrError(
		await requestPasswordReset({
			email: email.trim(),
			redirectTo: `${window.location.origin}/reset-password`
		})
	)
	success()
	navigate('/')
}

export const ForgotPasswordDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent className="max-w-sm" close={close}>
				<DialogHeader>
					<DialogTitle>Forgot your password?</DialogTitle>
					<DialogDescription>
						Please enter your email and we will send you a link to reset your
						password.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={forgotPasswordSchema}
					onSubmit={forgotPasswordCommand}
					onError={error => toast.error(error.message)}
				>
					<DialogFooter className="gap-2 flex flex-row items-center">
						<div className="mr-auto">
							Back to{' '}
							<Link to="/" className="text-link">
								login
							</Link>{' '}
							or{' '}
							<Link to="/register" className="text-link">
								registration
							</Link>
							.
						</div>
						<Button type="submit">Send email</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
