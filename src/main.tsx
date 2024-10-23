import { createRoot } from 'react-dom/client'
import './index.css'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider.tsx'
import { LoggedIn } from './routing/logged-in.tsx'
import { LoggedOut } from './routing/logged-out.tsx'
import { $user } from './state/user.ts'

const Main = () => (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<BrowserRouter basename="/">
				{$user.value ? <LoggedIn /> : <LoggedOut />}
			</BrowserRouter>
		</ThemeProvider>
	</StrictMode>
)

Maybe.fromNullable(document.getElementById('app'))
	.map(createRoot)
	.map(r => r.render(<Main />))
	.ifNothing(() => console.error('No element with id "app" found'))
