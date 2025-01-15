import { App } from '@/app'
import { ApiKeys } from '@/components/pages/apikeys/apikeys'
import { Route, Routes } from 'react-router-dom'

export const LoggedIn = () => {
	return (
		<Routes>
			<Route path="/api-keys" Component={ApiKeys} />
			<Route path="/" Component={App} />
		</Routes>
	)
}
