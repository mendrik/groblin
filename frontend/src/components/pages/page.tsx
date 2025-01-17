import { ScrollArea } from '@radix-ui/react-scroll-area'
import type { PropsWithChildren } from 'react'
import { Layout } from '../layout'

export const Page = ({ children }: PropsWithChildren<{}>) => {
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
