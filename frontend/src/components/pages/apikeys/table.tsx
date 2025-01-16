import { MicroIcon } from '@/components/ui/random/micro-icon'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { formatIsoDate } from '@/lib/date'
import { $apiKeys } from '@/state/apikeys'
import { Check, Copy, Trash, X } from 'lucide-react'

export const ApiKeyTable = () => {
	return (
		<Table>
			<TableCaption>A list of api keys for this project.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[16px]" />
					<TableHead className="w-[100px]">Name</TableHead>
					<TableHead>Key</TableHead>
					<TableHead className="w-[100px]">Expires</TableHead>
					<TableHead className="w-[100px]">Last used</TableHead>
					<TableHead className="w-[16px]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{$apiKeys.value.map(key => (
					<TableRow key={key.key}>
						<TableCell className="font-medium">
							{key.is_active ? (
								<MicroIcon icon={Check} />
							) : (
								<MicroIcon icon={X} />
							)}
						</TableCell>
						<TableCell>{key.name}</TableCell>
						<TableCell className="flex gap-1 items-center">
							{key.key.slice(0, 8)}...{key.key.slice(-8)}
							<MicroIcon icon={Copy} />
						</TableCell>
						<TableCell>{formatIsoDate(key.expires_at)}</TableCell>
						<TableCell>{formatIsoDate(key.last_used)}</TableCell>
						<TableCell>
							<MicroIcon icon={Trash} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
