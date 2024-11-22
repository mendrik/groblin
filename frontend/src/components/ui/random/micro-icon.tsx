import type { Icon } from '@tabler/icons-react'
import { Button, type ButtonProps } from '../button'

type ListButtonProps = {
	icon: Icon
} & ButtonProps

export const MicroIcon = ({ icon: Icon, ...rest }: ListButtonProps) => (
	<Button
		size="icon"
		variant="ghost"
		className="p-1 h-5 w-5 content-center"
		{...rest}
	>
		<Icon className="h-4 w-4 shrink-0 text-muted-foreground" stroke={1} />
	</Button>
)
