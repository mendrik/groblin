import { ForgotPasswordDialog } from '@/components/app/authentication/forgot-password'
import { PasswordResetDialog } from '@/components/app/authentication/password-reset'
import { RegistrationDialog } from '@/components/app/authentication/register-dialog'
import { LoginPage } from '@/components/pages/login'
import {} from '@/components/ui/form'
import { Route } from 'wouter'

export const LoggedOut = () => (
	<>
		<Route path="/reset-password" component={PasswordResetDialog} />
		<Route path="/password" component={ForgotPasswordDialog} />
		<Route path="/register" component={RegistrationDialog} />
		<Route path="/" component={LoginPage} />
	</>
)
