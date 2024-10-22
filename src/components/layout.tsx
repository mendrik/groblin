import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import type { PropsWithChildren } from 'react'
import { AppSidebar } from './app/app-sidebar'

export const Layout = ({ children }: PropsWithChildren) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main>
				<SidebarTrigger />
				{children}
			</main>
		</SidebarProvider>
	)
}
