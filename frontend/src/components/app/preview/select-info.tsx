import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'

export const SelectInfo = () => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-6 w-6 mr-8" stroke={1} />
		<AlertTitle className="!pl-10">Notice</AlertTitle>
		<AlertDescription className="!pl-10">
			To activate the preview panel, select a node in the document tree.
		</AlertDescription>
	</Alert>
)
