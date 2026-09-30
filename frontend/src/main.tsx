import { setDefaultOptions } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Router, Switch } from 'wouter'
import { PasswordResetDialog } from './components/app/authentication/password-reset'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import { getSession } from './lib/auth-client'
import { LoggedIn } from './routing/logged-in'
import { LoggedOut } from './routing/logged-out'
import { loadProject } from './state/project'
import { $user } from './state/user'

import './components/editor/tiptap-editor.css'
import './index.css'
import './state/project'

const Main = () => (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Toaster
				richColors
				theme="system"
				duration={5000}
				toastOptions={{
					classNames: {
						error: 'bg-red-400',
						success: 'text-green-400',
						warning: 'text-yellow-400',
						info: 'bg-blue-400'
					}
				}}
			/>
			<Router>
				<Switch>
					<Route path="/reset-password" component={PasswordResetDialog} />
					<Route>{$user.value ? <LoggedIn /> : <LoggedOut />}</Route>
				</Switch>
			</Router>
		</ThemeProvider>
	</StrictMode>
)

setDefaultOptions({
	locale: enGB,
	weekStartsOn: 1
})

getSession()
	.then(async ({ data }) => {
		if (data?.user) {
			await loadProject(data.user.id)
			$user.value = data.user
		}
	})
	.catch(() => {
		$user.value = undefined
	})
	.finally(() =>
		Maybe.fromNullable(document.getElementById('app'))
			.map(createRoot)
			.map(r => r.render(<Main />))
			.ifNothing(() => console.error('No element with id "app" found'))
	)
