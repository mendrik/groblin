import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { toast } from 'sonner'
import { Link, useLocation } from 'wouter'
import { email, strictObject, string, type infer as TypeOf } from 'zod/v4'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { metas, stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { dataOrError, signUp } from '@/lib/auth-client'
import { setSignal } from '@/lib/signals'
import { invitationReturn } from '@/routing/return-to'
import type { NavigateFn } from '@/routing/types'

const registrationSchema = strictObject({
	name: stringField('Name', EditorType.Input, 'name', 'Full name'),
	email: email().register(metas, {
		label: 'Email',
		editor: EditorType.Email,
		autofill: 'username'
	}),
	password: string().min(12).max(128).register(metas, {
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
const _lockForm = () => setSignal($locked, true)

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

const registerCommand =
	(navigate: NavigateFn) =>
	async ({ repeatPassword: _repeat, ...data }: RegistrationForm) => {
		$locked.value = true
		try {
			dataOrError(
				await signUp.email({
					...data,
					email: data.email.trim(),
					callbackURL: invitationReturn()
				})
			)
			success()
			navigate(invitationReturn())
		} finally {
			$locked.value = false
		}
	}

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
