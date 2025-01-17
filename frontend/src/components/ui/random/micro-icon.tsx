import { cn } from '@/lib/utils'
import type { Icon, IconProps } from '@/type-patches/icons'
import type { RefObject } from 'react'
import { Button, type ButtonProps } from '../button'

export type MicroIconProps = {
	icon: Icon
	onClick?: ButtonProps['onClick']
	size?: number
	ref?: RefObject<HTMLButtonElement | null>
	title?: string
} & Omit<IconProps, 'onClick' | 'ref'>

export const MicroIcon = ({
	icon: Icon,
	strokeWidth = 1,
	ref,
	absoluteStrokeWidth = true,
	onClick,
	title,
	size = 24,
	className,
	...rest
}: MicroIconProps) => (
	<Button
		ref={ref}
		size="icon"
		variant="ghost"
		title={title}
		className={cn(
			'aspect-square p-[2px] text-muted-foreground hover:text-primary',
			className
		)}
		style={{ height: size, width: size }}
		onClick={onClick}
	>
		<Icon
			className="shrink-0"
			strokeWidth={strokeWidth}
			size={size - 4}
			absoluteStrokeWidth
			{...rest}
		/>
	</Button>
)
