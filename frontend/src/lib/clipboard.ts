import { toast } from 'sonner'

export const copyToClipboard = (text: string) =>
	navigator.clipboard
		.writeText(text)
		.then(() =>
			toast.success('Clipboard', {
				description: 'Copied successfully to clipboard!'
			})
		)
		.catch(error => console.error('Error copying text: ', error))
