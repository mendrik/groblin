import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Icon } from '@/components/ui/simple/icon'
import { AlertCircle } from 'lucide-react'

export const NoSupport = () => (
	<Alert variant="default" className="max-w-sm m-auto mt-10">
		<Icon icon={AlertCircle} size={22} />
		<AlertTitle className="!pl-10">Information</AlertTitle>
		<AlertDescription className="!pl-10">
			For this node type there is no preview panel available.
		</AlertDescription>
	</Alert>
)
