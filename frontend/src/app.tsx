import './app.css'
import { DocumentTree } from './components/app/document-tree'
import { NodeValues } from './components/app/node-values'
import { Tags } from './components/app/tags'
import { Layout } from './components/layout'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'
import { ScrollArea } from './components/ui/scroll-area'
import { setSignal } from './lib/utils'
import { $panelSizes } from './state/panels'
import {} from './state/tree'

export function App() {
	return (
		<Layout>
			<ScrollArea className="w-full h-full">
				<ResizablePanelGroup
					direction="horizontal"
					className="w-full"
					onLayout={setSignal($panelSizes)}
				>
					<ResizablePanel defaultSize={$panelSizes.value[0]}>
						<div className="w-full h-11 shrink-0">
							<h1 className="px-2 py-1 text-xl font-normal text-muted-foreground tracking-tight transition-colors">
								My Test project
							</h1>
						</div>
						<DocumentTree />
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={$panelSizes.value[1]}>
						<div className="w-full shrink-0 h-11 p-1">
							<Tags />
						</div>
						<div className="flex-1 py-2">
							<NodeValues />
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={$panelSizes.value[2]}>
						Preview
					</ResizablePanel>
				</ResizablePanelGroup>
			</ScrollArea>
		</Layout>
	)
}
