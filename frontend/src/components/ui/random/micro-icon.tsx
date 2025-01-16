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
		className={cn(
			'h-[20px] w-[20px] text-muted-foreground hover:text-primary',
			className
		)}
		onClick={onClick}
	>
		<Icon
			className="shrink-0"
			strokeWidth={strokeWidth}
			size={16}
			absoluteStrokeWidth
			{...rest}
		/>
	</Button>
)
