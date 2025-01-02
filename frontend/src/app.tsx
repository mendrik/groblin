import { ErrorBoundary } from 'react-error-boundary'
import './app.css'
import { DocumentTree } from './components/app/document-tree'
import { NodeValues } from './components/app/node-values'
import { PreviewPanel } from './components/app/preview/preview-panel'
import { Layout } from './components/layout'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'
import { ScrollArea } from './components/ui/scroll-area'
import { setSignal } from './lib/signals'
import { notNil } from './lib/signals'
import { $panelSizes } from './state/panels'
import { $project } from './state/project'

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
						<div className="w-full h-8 shrink-0">
							<h1 className="px-2 py-1 text-xl font-normal text-muted-foreground tracking-tight transition-colors truncate  w-full overflow-hidden">
								{notNil($project).name}
							</h1>
						</div>
						<DocumentTree />
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={$panelSizes.value[1]}>
						<div className="w-full shrink-0 h-8 p-1" />
						<div className="flex-1 py-2">
							<NodeValues />
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						defaultSize={$panelSizes.value[2]}
						className="container-size"
					>
						<div className="w-full shrink-0 h-10 p-1" />
						<ErrorBoundary fallback={<div>Preview panel has crashed</div>}>
							<PreviewPanel />
						</ErrorBoundary>
					</ResizablePanel>
				</ResizablePanelGroup>
			</ScrollArea>
		</Layout>
	)
}
