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
		className={cn('h-[20px] w-[20px]', className)}
		onClick={onClick}
	>
		<Icon
			className="shrink-0 text-muted-foreground"
			strokeWidth={strokeWidth}
			size={16}
			absoluteStrokeWidth
			{...rest}
		/>
	</Button>
)
