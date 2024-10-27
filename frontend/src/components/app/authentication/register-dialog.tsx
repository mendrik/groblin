import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { EditorType } from '@/components/ui/tree/types'
import { asField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { stopPropagation } from '@/lib/dom-events'
import {} from '@/lib/match'
import { pipeAsync } from '@/lib/pipe-async'
import type { Fn } from '@/type-patches/functions'
import { pipe } from 'ramda'
import { Link } from 'react-router-dom'
import { type TypeOf, strictObject, string } from 'zod'

const registrationSchema = strictObject({
	name: string().describe(
		asField({
			label: 'Name',
			editor: EditorType.input
		})
	),
	email: string().describe(
		asField({
			label: 'Email',
			editor: EditorType.email
		})
	),
	password: string().describe(
		asField({
			label: 'Password',
			editor: EditorType.password
		})
	),
	repeatPassword: string().describe(
		asField({
			label: 'Repeat password',
			editor: EditorType.password
		})
	)
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
