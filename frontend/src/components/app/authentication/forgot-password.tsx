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
import { EditorType } from '@shared/enums'
import { pipeTap } from '@shared/utils/pipe-tap'
import type { Fn } from '@tp/functions.ts'
import { pipe } from 'ramda'
import { toast } from 'sonner'
import { Link } from 'wouter'
import { navigate } from 'wouter/use-browser-location'
import { type TypeOf, strictObject } from 'zod'

const forgotPasswordSchema = strictObject({
	email: stringField('Email', EditorType.Email, 'username')
})

type ForgotPassword = TypeOf<typeof forgotPasswordSchema>

const success = () =>
	toast.success('Reset password email was sent', {
		description: 'Check your mail box for a link to reset your password',
		closeButton: true
	})

const forgotPasswordCommand: Fn<ForgotPassword, void> = pipeTap(success, () =>
	navigate('/')
)

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
					onSubmit={pipe(forgotPasswordCommand)}
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
