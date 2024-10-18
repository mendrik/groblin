import * as React from 'react'

import { cn } from '@/lib/utils'
import type { Icon } from '@/type-patches/icons'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: Icon
}

const Inp = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, icon: Icon, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-0 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
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
	({ className, type, icon: Icon, ...props }, ref) => {
		return Icon ? (
			<div className="flex flex-row relative items-center w-full">
				<Icon
					className="absolute translate-x-1 shrink-0 w-4 h-4"
					stroke={0.5}
				/>
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
