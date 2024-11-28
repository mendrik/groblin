import { ForgotPasswordDialog } from '@/components/app/authentication/forgot-password'
import { LoginDialog } from '@/components/app/authentication/login-dialog'
import { PasswordResetDialog } from '@/components/app/authentication/password-reset'
import { RegistrationDialog } from '@/components/app/authentication/register-dialog'
import { ColorPicker } from '@/components/ui/color-picker'
import { Route, Routes } from 'react-router-dom'

export const LoggedOut = () => (
	<Routes>
		<Route path="/color" Component={ColorPicker} />
		<Route path="/reset-password" Component={PasswordResetDialog} />
		<Route path="/password" Component={ForgotPasswordDialog} />
		<Route path="/register" Component={RegistrationDialog} />
		<Route path="/" Component={LoginDialog} />
	</Routes>
)
