import { LoginDialog } from '@/components/app/authentication/login-dialog'
import { Route, Routes } from 'react-router-dom'

export const LoggedOut = () => (
	<Routes>
		<Route path="/" Component={LoginDialog} />
	</Routes>
)
