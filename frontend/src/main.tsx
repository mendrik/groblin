import { createRoot } from 'react-dom/client'
import './index.css'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import { LoggedIn } from './routing/logged-in'
import { LoggedOut } from './routing/logged-out'
import { $user } from './state/user'

const Main = () => (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<BrowserRouter basename="/">
				{$user.value ? <LoggedIn /> : <LoggedOut />}
				<Toaster richColors theme="system" duration={5000} />
			</BrowserRouter>
		</ThemeProvider>
	</StrictMode>
)

Maybe.fromNullable(document.getElementById('app'))
	.map(createRoot)
	.map(r => r.render(<Main />))
	.ifNothing(() => console.error('No element with id "app" found'))
