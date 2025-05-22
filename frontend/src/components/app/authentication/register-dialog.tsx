import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { asField, stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { signUp } from '@/lib/auth-client'
import { setSignal } from '@/lib/signals'
import type { NavigateFn } from '@/routing/types'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { evolveAlt } from 'matchblade'
import { pipeAsync } from 'matchblade'
import { omit } from 'ramda'
import { toast } from 'sonner'
import { Link, useLocation } from 'wouter'
import { type TypeOf, strictObject, string } from 'zod'

const registrationSchema = strictObject({
	name: stringField('Name', EditorType.Input, 'name', 'Full name'),
	email: asField(string().email(), {
		label: 'Email',
		editor: EditorType.Email,
		autofill: 'username'
	}),
	password: asField(string().min(8).max(32), {
		label: 'Password',
		editor: EditorType.Password,
		autofill: 'new-password'
	}),
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

const registerCommand = (navigate: NavigateFn): Fn<RegistrationForm, unknown> =>
	pipeAsync(
		omit(['repeatPassword']),
		evolveAlt({
			callbackURL: '/dashboard'
		}),
		s =>
			signUp.email(s, {
				onRequest: () => void lockForm(),
				onSuccess: () => navigate('/'),
				onError: ({ error }) => void failed(error)
			})
	)

export const RegistrationDialog = () => {
	const [_, navigate] = useLocation()
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
					onSubmit={registerCommand(navigate)}
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
