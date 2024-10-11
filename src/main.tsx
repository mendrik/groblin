import { createRoot } from 'react-dom/client'

import { App } from './app.tsx'
import './index.css'
import { Maybe } from 'purify-ts'
import { ThemeProvider } from './components/theme-provider.tsx'

const Main = () => (
	<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
		<App />
	</ThemeProvider>
)

Maybe.fromNullable(document.getElementById('app'))
	.map(createRoot)
	.map(r => r.render(<Main />))
	.ifNothing(() => console.error('No element with id "app" found'))
