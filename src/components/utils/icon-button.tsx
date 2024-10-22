import { cn } from '@/lib/utils'
import type { Icon } from '@/type-patches/icons'
import type { PropsWithChildren } from 'react'
import { Button, type ButtonProps } from '../ui/button'

type OwnProps = {
	icon: Icon
} & ButtonProps

export const IconButton = ({
	icon: Icon,
	variant = 'outline',
	className,
	children,
	...props
}: PropsWithChildren<OwnProps>) => {
	return (
		<Button
			variant={variant}
			className={cn('flex flex-row gap-1', className)}
			{...props}
		>
			<Icon className="w-5 h-5" />
			<div>{children}</div>
		</Button>
	)
}
