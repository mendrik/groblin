import { Icon } from '@/components/ui/simple/icon'
import { Settings } from 'lucide-react'

export const PreviewLoader = () => (
	<div className="flex w-full justify-center items-center">
		<Icon icon={Settings} className="animate-spin" size={28} />
	</div>
)
