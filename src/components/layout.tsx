import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'
import { AppSidebar } from './app/app-sidebar'

export const Layout = ({ children }: PropsWithChildren) => {
	return (
		<div className="flex flex-row items-stretch min-h-screen">
			<AppSidebar />
			<main className={cn('flex-1 relative')}>{children}</main>
		</div>
	)
}
