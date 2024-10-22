import { createRoot } from 'react-dom/client'

import { App } from './app.tsx'
import './index.css'
import { Maybe } from 'purify-ts'
import { StrictMode } from 'react'
import { Layout } from './components/layout.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'

const Main = () => (
	<StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Layout>
				<App />
			</Layout>
		</ThemeProvider>
	</StrictMode>
)

Maybe.fromNullable(document.getElementById('app'))
	.map(createRoot)
	.map(r => r.render(<Main />))
	.ifNothing(() => console.error('No element with id "app" found'))
