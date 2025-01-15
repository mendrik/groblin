import { App } from '@/app'
import { ApiKeys } from '@/components/pages/apikeys/apikeys'
import { Route } from 'wouter'

export const LoggedIn = () => {
	return (
		<>
			<Route path="/api-keys" component={ApiKeys} />
			<Route path="/" component={App} />
		</>
	)
}
