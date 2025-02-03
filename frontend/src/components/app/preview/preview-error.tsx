import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Icon } from '@/components/ui/simple/icon'
import { AlertCircle } from 'lucide-react'

type OwnProps = {
	error: Error
}

export const PreviewError = ({ error }: OwnProps) => (
	<Alert variant="default" className="max-w-sm m-auto mt-10">
		<Icon icon={AlertCircle} size={28} />
		<AlertTitle className="!pl-10">Error</AlertTitle>
		<AlertDescription className="!pl-10">{error.message}</AlertDescription>
	</Alert>
)
