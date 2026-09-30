import { EditorType } from '@shared/enums'
import { pipeAsync } from 'matchblade'
import { prop } from 'ramda'
import { toast } from 'sonner'
import { Link, useLocation } from 'wouter'
import { strictObject, type TypeOf } from 'zod/v4'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { stringField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { dataOrError, signIn } from '@/lib/auth-client'
import { setSignal } from '@/lib/signals'
import { invitationReturn } from '@/routing/return-to'
import { loadProject } from '@/state/project'
import { $user } from '@/state/user'

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

const loginCommand: (credentials: LoginForm) => Promise<any> = pipeAsync(
	credentials => ({
		...credentials,
		email: credentials.email.trim()
	}),
	signIn.email,
	dataOrError,
	prop('user'),
	user => loadProject(user.id).then(() => user),
	setSignal($user),
	_ => toast.success('Successfully logged in')
)

export const LoginDialog = () => {
	const [, navigate] = useLocation()
	return (
		<Card className="w-auto max-w-sm p-4 h-fit shadow-lg">
			<CardHeader className="p-0 pb-4">
				<CardTitle>Login</CardTitle>
				<CardDescription>Please enter your email and password</CardDescription>
			</CardHeader>
			<ZodForm
				schema={loginSchema}
				onSubmit={async credentials => {
					await loginCommand(credentials)
					navigate(invitationReturn())
				}}
				onError={failed}
			>
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
