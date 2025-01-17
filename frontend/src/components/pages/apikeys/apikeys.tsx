import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker/date-picker-dialog'
import {} from '@/components/ui/table'
import { Page } from '../page'
import { ApiKeyCreate, openApiKeyCreate } from './apikey-create'
import { ApiKeyTable } from './table'

export function ApiKeys() {
	return (
		<Page>
			<div className="flex flex-row gap-2">
				<h1 className="flex-grow">Api keys</h1>
				<Button variant="secondary" onClick={openApiKeyCreate}>
					Create new api key
				</Button>
			</div>
			<ApiKeyTable />
			<ApiKeyCreate />
			<DatePicker />
		</Page>
	)
}
