import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { $apiKeys } from '@/state/apikeys'

export const ApiKeyTable = () => {
	return (
		<Table>
			<TableCaption>A list of api keys for this project.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[20px]" />
					<TableHead className="w-[100px]">Name</TableHead>
					<TableHead>Key</TableHead>
					<TableHead className="w-[100px]">Expires</TableHead>
					<TableHead className="w-[100px]">Last used</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{$apiKeys.value.map(key => (
					<TableRow key={key.key}>
						<TableCell className="font-medium">{key.is_active}</TableCell>
						<TableCell>{key.name}</TableCell>
						<TableCell>{key.key}</TableCell>
						<TableCell>{key.expires_at}</TableCell>
						<TableCell>{key.last_used}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
