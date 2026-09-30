import { useSignalEffect } from '@preact/signals-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker/date-picker-dialog'
import { $canManage } from '@/state/access'
import { $apiKeysError, startApiKeys, stopApiKeys } from '@/state/apikeys'
import { $project } from '@/state/project'
import { Page } from '../page'
import { ApiKeyCreate, openApiKeyCreate } from './apikey-create'
import { ApiKeyTable } from './table'

export function ApiKeys() {
	useSignalEffect(() => {
		if ($canManage.value && $project.value) startApiKeys()
		return stopApiKeys
	})
	return (
		<Page>
			<div className="flex flex-row gap-2">
				<h1 className="flex-grow">Api keys</h1>
				<Button variant="secondary" onClick={openApiKeyCreate}>
					Create new api key
				</Button>
			</div>
			<ApiKeyTable />
			{$apiKeysError.value && <p role="alert">{$apiKeysError.value}</p>}
			<ApiKeyCreate />
			<DatePicker />
		</Page>
	)
}
