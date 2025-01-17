import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Layout } from 'lucide-react'
import type { PropsWithChildren } from 'react'

export const Page = ({ children }: PropsWithChildren) => {
	return (
		<Layout>
			<ScrollArea>
				<div className="max-w-2xl p-4 w-full max-h-svh prose prose-sm prose-slate dark:prose-invert">
					{children}
				</div>
			</ScrollArea>
		</Layout>
	)
}
