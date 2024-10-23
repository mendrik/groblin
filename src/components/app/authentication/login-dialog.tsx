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
import { type TypeOf, boolean, strictObject, string } from 'zod'

const loginSchema = strictObject({
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
	rememberMe: boolean().describe(
		asField({
			label: 'Remember me',
			editor: EditorType.switch
		})
	)
})

type Login = TypeOf<typeof loginSchema>

const loginCommand: Fn<Partial<Login>, void> = pipeAsync(console.log)

export const LoginDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent
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
				<ZodForm schema={loginSchema} onSubmit={pipe(loginCommand)} columns={2}>
					<DialogFooter className="gap-2 flex flex-row items-center">
						<div className="mr-auto">
							Forgot your{' '}
							<Link to="/password" className="text-link">
								password
							</Link>{' '}
							or need to{' '}
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
