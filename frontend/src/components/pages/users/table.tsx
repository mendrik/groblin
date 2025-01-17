import { MicroIcon } from '@/components/ui/random/micro-icon'
import { WiggleMicroIcon } from '@/components/ui/random/wiggle-micro-icon'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { deleteApiKey } from '@/state/apikeys'
import { $users } from '@/state/users'
import { Check, Trash } from 'lucide-react'

export const UserTable = () => {
	return (
		<Table>
			<TableCaption>A list of users for this project.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[16px]" />
					<TableHead className="align-middle p-0">Name</TableHead>
					<TableHead className="align-middle p-0">Email</TableHead>
					<TableHead className="w-[100px] align-middle p-0">Role</TableHead>
					<TableHead className="w-[16px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{$users.value.map(user => (
					<TableRow key={user.id}>
						<TableCell className="font-medium">
							<MicroIcon icon={Check} />
						</TableCell>
						<TableCell>{user.name}</TableCell>
						<TableCell>{user.email}</TableCell>
						<TableCell>{user.roles}</TableCell>
						<TableCell>
							<WiggleMicroIcon
								icon={Trash}
								onClick={() => deleteApiKey(user.id)}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
