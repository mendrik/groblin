import { Button } from '@/components/ui/button'
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {} from '@/components/ui/dialog'
import { asField, stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { login } from '@/state/user'
import { EditorType } from '@shared/enums'
import { toast } from 'sonner'
import { Link } from 'wouter'
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
	login(credentials).then(() => toast.success('Successfully logged in'))

export const LoginDialog = () => {
	return (
		<Card className="w-full max-w-sm p-4 h-fit shadow-lg">
			<CardHeader className="p-0 pb-4">
				<CardTitle>Login</CardTitle>
				<CardDescription>Please enter your email and password</CardDescription>
			</CardHeader>
			<ZodForm schema={loginSchema} onSubmit={loginCommand} onError={failed}>
				<CardFooter className="gap-2 flex flex-row items-center p-0">
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
				</CardFooter>
			</ZodForm>
		</Card>
	)
}
