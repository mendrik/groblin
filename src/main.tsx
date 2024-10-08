import { render } from 'preact'
import { App } from './app.tsx'
import './index.css'
import { Maybe } from 'purify-ts'

Maybe.fromNullable(document.getElementById('app'))
	.map(app => render(<App />, app))
	.ifNothing(() => console.error('No element with id "app" found'))
