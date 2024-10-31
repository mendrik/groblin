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
import { setSignal } from '@/lib/utils'
import { register } from '@/state/user'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import type { Fn } from '@tp/functions.ts'
import { omit } from 'ramda'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { type TypeOf, strictObject } from 'zod'

const registrationSchema = strictObject({
	name: nonEmptyString('Name', EditorType.Input).default('Andreas Herd'),
	email: nonEmptyString('Email', EditorType.Email, 'username').default(
		'mendrik76@gmail.com'
	),
	password: nonEmptyString(
		'Password',
		EditorType.Password,
		'new-password'
	).default('bla'),
	repeatPassword: nonEmptyString(
		'Repeat password',
		EditorType.Password,
		'new-password'
	).default('bla')
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
			<DialogContent
				closeButton={false}
				className="max-w-sm"
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
				<DialogHeader>
					<DialogTitle>Register an account</DialogTitle>
					<DialogDescription>
						Sign up to Groblin and create your first project.
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
						<Button type="submit">Send email</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
