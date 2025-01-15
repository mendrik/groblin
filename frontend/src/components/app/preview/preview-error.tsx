import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type OwnProps = {
	error: Error
}

export const PreviewError = ({ error }: OwnProps) => (
	<Alert variant="default" className="max-w-sm m-auto">
		<IconAlertCircle className="h-6 w-6 mr-8" stroke={1} />
		<AlertTitle className="!pl-10">Error</AlertTitle>
		<AlertDescription className="!pl-10">{error.message}</AlertDescription>
	</Alert>
)
