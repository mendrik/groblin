import { Route } from 'wouter'
import { ForgotPasswordDialog } from '@/components/app/authentication/forgot-password'
import { RegistrationDialog } from '@/components/app/authentication/register-dialog'
import { Guide } from '@/components/pages/guide'
import { LoginPage } from '@/components/pages/login'
import { rememberInvitation } from './return-to'

export const LoggedOut = () => (
	<>
		<Route path="/invite/:token">
			{params => {
				rememberInvitation(`/invite/${params.token}`)
				return <LoginPage />
			}}
		</Route>
		<Route path="/guide" component={Guide} />
		<Route path="/password" component={ForgotPasswordDialog} />
		<Route path="/register" component={RegistrationDialog} />
		<Route path="/" component={LoginPage} />
	</>
)
