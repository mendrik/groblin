import { Button } from '@/components/ui/button'
import {} from '@/components/ui/table'
import { Page } from '../page'
import { UserTable } from './table'
import { UserInvite, openUserInvite } from './user-invite'

export function Users() {
	return (
		<Page>
			<div className="flex flex-row gap-2">
				<h1 className="flex-grow">Project users</h1>
				<Button variant="secondary" onClick={openUserInvite}>
					Invite user...
				</Button>
			</div>
			<UserTable />
			<UserInvite />
		</Page>
	)
}
