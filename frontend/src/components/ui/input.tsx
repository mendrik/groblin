import * as React from 'react'

import { cn } from '@/lib/utils'
import type { Icon as IconProps } from '@/type-patches/icons'
import { Icon } from './simple/icon'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: IconProps
}

const Inp = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, icon: Icon, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'h-9 w-full rounded-md border border-input bg-transparent px-3 py-0 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Inp.displayName = 'NativeInput'

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, icon, ...props }, ref) => {
		return icon ? (
			<div className="flex flex-row relative items-center w-full">
				<Icon icon={icon} className="absolute translate-x-1" />
				<Inp
					{...props}
					className={cn(className, 'pl-[24px] flex-1')}
					ref={ref}
				/>
			</div>
		) : (
			<Inp className={className} {...props} ref={ref} />
		)
	}
)
Input.displayName = 'Input'

export { Input }
