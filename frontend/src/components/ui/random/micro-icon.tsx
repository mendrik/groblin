import { cn } from '@/lib/utils'
import type { Icon, IconProps } from '@/type-patches/icons'
import type { RefObject } from 'react'
import { Button, type ButtonProps } from '../button'

export type MicroIconProps = {
	icon: Icon
	onClick?: ButtonProps['onClick']
	ref?: RefObject<HTMLButtonElement | null>
} & Omit<IconProps, 'onClick' | 'ref'>

export const MicroIcon = ({
	icon: Icon,
	strokeWidth = 1,
	ref,
	absoluteStrokeWidth = true,
	onClick,
	className,
	...rest
}: MicroIconProps) => (
	<Button
		ref={ref}
		size="icon"
		variant="ghost"
		className={cn(
			'h-[20px] w-[20px] p-[2px] text-muted-foreground hover:text-primary',
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
