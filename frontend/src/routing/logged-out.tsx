import { ForgotPasswordDialog } from '@/components/app/authentication/forgot-password'
import { LoginDialog } from '@/components/app/authentication/login-dialog'
import { RegistrationDialog } from '@/components/app/authentication/register-dialog'
import { Route, Routes } from 'react-router-dom'

export const LoggedOut = () => (
	<Routes>
		<Route path="/password" Component={ForgotPasswordDialog} />
		<Route path="/register" Component={RegistrationDialog} />
		<Route path="/" Component={LoginDialog} />
	</Routes>
)
