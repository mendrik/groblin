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
import { login } from '@/state/user'
import { EditorType } from '@shared/enums'
import { pipeAsync } from '@shared/utils/pipe-async'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { type TypeOf, boolean, strictObject } from 'zod'

const loginSchema = strictObject({
	email: stringField('Email', EditorType.Email, 'username'),
	password: stringField('Password', EditorType.Password, 'current-password'),
	rememberMe: asField(boolean().default(false), {
		label: 'Remember me',
		editor: EditorType.Switch
	})
})

const failed = (e: Error) =>
	toast.error('Failed to login', {
		description: e.message,
		closeButton: true
	})

type LoginForm = TypeOf<typeof loginSchema>

const loginCommand = ({ rememberMe, ...credentials }: LoginForm) =>
	pipeAsync(login, () => toast.success('Successfully logged in'))(credentials)

export const LoginDialog = () => {
	return (
		<Dialog open={true}>
			<DialogContent className="max-w-sm" close={close}>
				<DialogHeader>
					<DialogTitle>Login</DialogTitle>
					<DialogDescription>
						Please enter your email and password
					</DialogDescription>
				</DialogHeader>
				<ZodForm schema={loginSchema} onSubmit={loginCommand} onError={failed}>
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
