import { Route } from 'wouter'
import { App } from '@/app'
import { ApiKeys } from '@/components/pages/apikeys/apikeys'
import { Guide } from '@/components/pages/guide'
import { Profile } from '@/components/pages/profile/profile'
import { Projects } from '@/components/pages/projects/projects'
import { Publication } from '@/components/pages/publication/publication'
import { Invitation } from '@/components/pages/users/invitation'
import { Users } from '@/components/pages/users/users'
import { ContentHistory } from '@/components/ui/content-history'
import { SaveStatus } from '@/components/ui/save-status'
import { $canManage } from '@/state/access'
import { $project } from '@/state/project'
import { RouteObserver } from './route-observer'

export const LoggedIn = () => {
	return (
		<>
			<RouteObserver />
			<SaveStatus />
			<ContentHistory />
			<Route path="/guide" component={Guide} />
			<Route path="/projects" component={Projects} />
			<Route path="/publication" component={Publication} />
			<Route path="/profile" component={Profile} />
			<Route path="/invite/:token">
				{params => <Invitation token={params.token} />}
			</Route>
			<Route path="/api-keys">
				{$canManage.value ? <ApiKeys /> : <Projects />}
			</Route>
			<Route path="/users">{$canManage.value ? <Users /> : <Projects />}</Route>
			<Route path="/">{$project.value ? <App /> : <Projects />}</Route>
		</>
	)
}
