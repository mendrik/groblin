import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { asField, nonEmptyString } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { stopPropagation } from '@/lib/dom-events'
import {} from '@/lib/match'
import { pipeAsync } from '@/lib/pipe-async'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { pipe } from 'ramda'
import { Link } from 'react-router-dom'
import { type TypeOf, boolean, strictObject } from 'zod'

const loginSchema = strictObject({
	email: nonEmptyString('Email', EditorType.Email),
	password: nonEmptyString('Password', EditorType.Password),
	rememberMe: boolean()
		.describe(
			asField({
				label: 'Remember me',
				editor: EditorType.Switch
			})
		)
		.default(false)
})

type Login = TypeOf<typeof loginSchema>

const loginCommand: Fn<Partial<Login>, void> = pipeAsync(console.log)

export const LoginDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent
				className="max-w-sm"
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
				<DialogHeader>
					<DialogTitle>Login</DialogTitle>
					<DialogDescription>
						Please enter your email and password
					</DialogDescription>
				</DialogHeader>
				<ZodForm schema={loginSchema} onSubmit={pipe(loginCommand)}>
					<DialogFooter className="gap-2 flex flex-row items-center">
						<div className="mr-auto">
							Did you forget your{' '}
							<Link to="/password" className="text-link">
								password
							</Link>
							<br />
							or still need to{' '}
							<Link to="/register" className="text-link">
								register
							</Link>
							?
						</div>
						<Button type="submit">Login</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
