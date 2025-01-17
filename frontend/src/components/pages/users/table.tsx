import { WiggleMicroIcon } from '@/components/ui/random/wiggle-micro-icon'
import { Icon } from '@/components/ui/simple/icon'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { $users, deleteUser } from '@/state/users'
import { Check, Trash } from 'lucide-react'

export const UserTable = () => {
	return (
		<Table>
			<TableCaption>A list of users for this project.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[16px]" />
					<TableHead className="align-middle py-0">Name</TableHead>
					<TableHead className="align-middle py-0">Email</TableHead>
					<TableHead className="w-[100px] align-middle py-0">Roles</TableHead>
					<TableHead className="w-[16px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{$users.value.map(user => (
					<TableRow key={user.id}>
						<TableCell className="font-medium">
							<Icon icon={Check} />
						</TableCell>
						<TableCell>{user.name}</TableCell>
						<TableCell>{user.email}</TableCell>
						<TableCell>{}</TableCell>
						<TableCell>
							<WiggleMicroIcon
								icon={Trash}
								onClick={() => deleteUser(user.id)}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
