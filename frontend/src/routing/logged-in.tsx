import { App } from '@/app'
import { ApiKeys } from '@/components/pages/apikeys/apikeys'
import { Route } from 'wouter'
import { RouteObserver } from './route-observer'

export const LoggedIn = () => {
	return (
		<>
			<RouteObserver />
			<Route path="/api-keys" component={ApiKeys} />
			<Route path="/" component={App} />
		</>
	)
}
