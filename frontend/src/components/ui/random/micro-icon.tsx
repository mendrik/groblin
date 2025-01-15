import { cn } from '@/lib/utils'
import type { Icon, IconProps } from '@/type-patches/icons'
import { Button, type ButtonProps } from '../button'

type ListButtonProps = {
	icon: Icon
	onClick?: ButtonProps['onClick']
} & Omit<IconProps, 'onClick'>

export const MicroIcon = ({
	icon: Icon,
	strokeWidth = 1,
	absoluteStrokeWidth = true,
	onClick,
	className,
	...rest
}: ListButtonProps) => (
	<Button
		size="icon"
		variant="ghost"
		className={cn('p-1 h-5 w-5 content-center', className)}
		onClick={onClick}
	>
		<Icon
			className="h-4 w-4 shrink-0 text-muted-foreground"
			strokeWidth={strokeWidth}
			absoluteStrokeWidth
			{...rest}
		/>
	</Button>
)
