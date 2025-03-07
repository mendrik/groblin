import { Button } from '@/components/ui/button'
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {} from '@/components/ui/dialog'
import { stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { dataOrError, signIn } from '@/lib/auth-client'
import { setSignal } from '@/lib/signals'
import { $user } from '@/state/user'
import { EditorType } from '@shared/enums'
import { prop } from 'ramda'
import { toast } from 'sonner'
import { Link } from 'wouter'
import { type TypeOf, strictObject } from 'zod'

const loginSchema = strictObject({
	email: stringField('Email', EditorType.Email, 'username'),
	password: stringField('Password', EditorType.Password, 'current-password')
})

const failed = (e: Error) =>
	toast.error('Failed to login', {
		description: e.message,
		closeButton: true
	})

type LoginForm = TypeOf<typeof loginSchema>

const loginCommand = (credentials: LoginForm) =>
	signIn
		.email(credentials)
		.then(dataOrError)
		.then(prop('user'))
		.then(setSignal($user))
		.then(_ => toast.success('Successfully logged in'))

export const LoginDialog = () => {
	return (
		<Card className="w-auto max-w-sm p-4 h-fit shadow-lg">
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
