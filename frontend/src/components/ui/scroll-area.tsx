import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as React from 'react'
import './scroll-fade.css'

import { cn } from '@/lib/utils'

const setScrollFade =
	(height: number) => (e: React.UIEvent<HTMLDivElement>) => {
		const scroll = e.target as HTMLDivElement
		const scrollBottom = Math.abs(
			scroll.scrollTop + scroll.clientHeight - scroll.scrollHeight
		)
		const topOpacity = 1 - Math.max(height - scroll.scrollTop, 0) / height
		const bottomOpacity = 1 - Math.max(height - scrollBottom, 0) / height
		const style = scroll.parentElement?.style
		style?.setProperty('--top-opacity', topOpacity.toString())
		style?.setProperty('--bottom-opacity', bottomOpacity.toString())
	}

const ScrollArea = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
		fadeHeight?: number
		viewPortClassName?: string
	}
>(
	(
		{ className, children, viewPortClassName, fadeHeight = 50, ...props },
		ref
	) => (
		<ScrollAreaPrimitive.Root
			ref={ref}
			className={cn(
				'relative overflow-hidden scroll-fade min-h-[-webkit-fill-available]',
				className
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				className={cn('h-full w-full rounded-[inherit]', viewPortClassName)}
				onScroll={setScrollFade(fadeHeight)}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	)
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		orientation={orientation}
		className={cn(
			'flex touch-none select-none transition-colors',
			orientation === 'vertical' &&
				'h-full w-2.5 border-l border-l-transparent p-[1px]',
			orientation === 'horizontal' &&
				'h-2.5 flex-col border-t border-t-transparent p-[1px]',
			className
		)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
