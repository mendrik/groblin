import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Layout } from '../../layout'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker/date-picker-dialog'
import {} from '@/components/ui/table'
import { ApiKeyCreate, openApiKeyCreate } from './apikey-create'
import { ApiKeyTable } from './table'

export function ApiKeys() {
	return (
		<Layout>
			<ScrollArea>
				<div className="max-w-2xl p-4 w-full max-h-svh prose prose-sm prose-slate dark:prose-invert">
					<div className="flex flex-row gap-2">
						<h1 className="flex-grow">Api keys</h1>
						<Button variant="secondary" onClick={openApiKeyCreate}>
							Create new api key
						</Button>
					</div>
					<ApiKeyTable />
				</div>
			</ScrollArea>
			<ApiKeyCreate />
			<DatePicker />
		</Layout>
	)
}
