import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Icon } from '@/components/ui/simple/icon'
import { AlertCircle } from 'lucide-react'

export const SelectInfo = () => (
	<Alert variant="default" className="max-w-sm m-auto mt-10">
		<Icon icon={AlertCircle} className="mr-8" />
		<AlertTitle className="!pl-10">Notice</AlertTitle>
		<AlertDescription className="!pl-10">
			To activate the preview panel, select a node in the document tree.
		</AlertDescription>
	</Alert>
)
