import type { Icon, IconProps } from '@tabler/icons-react'
import { Button } from '../button'

type ListButtonProps = {
	icon: Icon
} & IconProps

export const MicroIcon = ({
	icon: Icon,
	stroke = 2,
	...rest
}: ListButtonProps) => (
	<Button size="icon" variant="ghost" className="p-1 h-5 w-5 content-center">
		<Icon
			className="h-4 w-4 shrink-0 text-muted-foreground"
			stroke={stroke}
			{...rest}
		/>
	</Button>
)
