import { createRoot } from 'react-dom/client'
import './index.css'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
import { LoggedIn } from './routing/logged-in'
import { LoggedOut } from './routing/logged-out'
import { $user, whoAmI } from './state/user'
import './state/project'

const Main = () => (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<BrowserRouter basename="/">
				{$user.value ? <LoggedIn /> : <LoggedOut />}
				<Toaster
					richColors
					theme="system"
					duration={5000}
					toastOptions={{
						classNames: {
							toast:
								'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:pointer-events-auto'
						}
					}}
				/>
			</BrowserRouter>
		</ThemeProvider>
	</StrictMode>
)

whoAmI().finally(() =>
	Maybe.fromNullable(document.getElementById('app'))
		.map(createRoot)
		.map(r => r.render(<Main />))
		.ifNothing(() => console.error('No element with id "app" found'))
)
