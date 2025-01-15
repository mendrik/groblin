import { cn } from '@/lib/utils'
import type { IconProps, Icon as IconType } from '@/type-patches/icons'

type ListButtonProps = {
	icon: IconType
} & IconProps

export const Icon = ({
	icon: Icon,
	size = 16,
	strokeWidth = 1,
	absoluteStrokeWidth = true,
	className,
	...rest
}: ListButtonProps) => (
	<Icon
		className={cn(className, 'shrink-0 text-muted-foreground')}
		strokeWidth={strokeWidth}
		focusable={false}
		tabIndex={-1}
		absoluteStrokeWidth
		size={size}
		{...rest}
	/>
)
