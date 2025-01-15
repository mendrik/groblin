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
import { register } from '@/state/user'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import type { Fn } from '@tp/functions.ts'
import { omit } from 'ramda'
import { toast } from 'sonner'
import { Link } from 'wouter'
import { type TypeOf, strictObject } from 'zod'

const registrationSchema = strictObject({
	name: stringField('Name', EditorType.Input, 'name', 'Full name'),
	email: stringField('Email', EditorType.Email, 'username', 'your@email.com'),
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

export type RegistrationForm = TypeOf<typeof registrationSchema>

const $locked = signal(false)
const lockForm = () => setSignal($locked, true)

const success = () =>
	toast.success('Successfully registered', {
		description: 'Check your email for a confirmation link',
		closeButton: true
	})

const failed = (e: Error) =>
	toast.error('Failed to register', {
		description: e.message,
		closeButton: true
	})

const registerCommand: Fn<RegistrationForm, unknown> = pipeAsync(
	omit(['repeatPassword']),
	register,
	success,
	lockForm
)

export const RegistrationDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent closeButton={false} className="max-w-sm" close={close}>
				<DialogHeader>
					<DialogTitle>Register an account</DialogTitle>
					<DialogDescription>
						Sign up to Groblin and create your first project. We will send you a
						registration email to confirm your account.
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={registrationSchema}
					onSubmit={registerCommand}
					onError={failed}
					disabled={$locked.value}
				>
					<DialogFooter className="gap-2 flex flex-row items-center">
						<div className="mr-auto">
							Back to{' '}
							<Link to="/" className="text-link">
								login
							</Link>{' '}
							or forgot your{' '}
							<Link to="/password" className="text-link">
								password
							</Link>
							?
						</div>
						<Button type="submit">Register</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
