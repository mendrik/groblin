import { cn } from '@/lib/utils'
import type {} from '@/type-patches/icons'
import { useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { MicroIcon, type MicroIconProps } from './micro-icon'

export const WiggleMicroIcon = ({ onClick, ...props }: MicroIconProps) => {
	const [armed, setArmed] = useState(false)
	const ref = useRef<HTMLButtonElement>(null)
	useClickAway(ref, () => setArmed(false))
	return (
		<MicroIcon
			ref={ref}
			{...props}
			onClick={ev => (armed ? onClick?.(ev) : setArmed(true))}
			className={cn(
				armed &&
					'animate-wiggle bg-destructive text-destructive-foreground hover:bg-destructive'
			)}
		/>
	)
}
