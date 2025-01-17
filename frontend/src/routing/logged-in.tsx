import { App } from '@/app'
import { ApiKeys } from '@/components/pages/apikeys/apikeys'
import { Users } from '@/components/pages/users/users'
import { Route } from 'wouter'
import { RouteObserver } from './route-observer'

export const LoggedIn = () => {
	return (
		<>
			<RouteObserver />
			<Route path="/api-keys" component={ApiKeys} />
			<Route path="/users" component={Users} />
			<Route path="/" component={App} />
		</>
	)
}
