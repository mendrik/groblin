import { setDefaultOptions } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router } from 'wouter'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'
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
			<Router base="/">{$user.value ? <LoggedIn /> : <LoggedOut />}</Router>
		</ThemeProvider>
	</StrictMode>
)

setDefaultOptions({
	locale: enGB,
	weekStartsOn: 1
})

loadProject().finally(() =>
	Maybe.fromNullable(document.getElementById('app'))
		.map(createRoot)
		.map(r => r.render(<Main />))
		.ifNothing(() => console.error('No element with id "app" found'))
)
