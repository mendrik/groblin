import { App } from '@/app'
import { Route, Routes } from 'react-router-dom'

export const LoggedIn = () => (
	<Routes>
		<Route path="/" Component={App} />
	</Routes>
)
