import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { nonEmptyString } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { stopPropagation } from '@/lib/dom-events'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import type { Fn } from '@tp/functions.ts'
import { pipe } from 'ramda'
import { Link } from 'react-router-dom'
import { type TypeOf, strictObject } from 'zod'

const forgotPasswordSchema = strictObject({
	email: nonEmptyString('Email', EditorType.Email)
})

type ForgotPassword = TypeOf<typeof forgotPasswordSchema>

const forgotPasswordCommand: Fn<Partial<ForgotPassword>, void> = pipeAsync(
	console.log
)

export const ForgotPasswordDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent
				className="max-w-sm"
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
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
					onError={console.error}
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
