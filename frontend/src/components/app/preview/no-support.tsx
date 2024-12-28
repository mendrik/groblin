import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'

export const NoSupport = () => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-6 w-6 mr-8" stroke={1} />
		<AlertTitle className="!pl-10">Information</AlertTitle>
		<AlertDescription className="!pl-10">
			For this node type there is no preview panel available.
		</AlertDescription>
	</Alert>
)
