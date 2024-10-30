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
import {} from '@/lib/match'
import { pipeAsync } from '@/lib/pipe-async'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { pipe } from 'ramda'
import { Link } from 'react-router-dom'
import { type TypeOf, strictObject } from 'zod'

const registrationSchema = strictObject({
	name: nonEmptyString('Name', EditorType.Input),
	email: nonEmptyString('Email', EditorType.Email),
	password: nonEmptyString('Password', EditorType.Password),
	repeatPassword: nonEmptyString('Repeat password', EditorType.Password)
}).refine(data => data.password === data.repeatPassword, {
	message: 'Passwords must match',
	path: ['repeatPassword']
})

type Registration = TypeOf<typeof registrationSchema>

const registerCommand: Fn<Partial<Registration>, void> = pipeAsync(console.log)

export const RegistrationDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent
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
				<ZodForm schema={registrationSchema} onSubmit={pipe(registerCommand)}>
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
