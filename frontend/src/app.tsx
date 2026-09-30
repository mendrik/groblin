import { ErrorBoundary } from 'react-error-boundary'
import { DeletionDialog } from './components/ui/deletion-dialog'
import './app.css'
import { useRef } from 'react'
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
import { InputDialog } from './components/ui/simple/input-dialog'
import useResize from './hooks/use-resize'
import { notNil } from './lib/signals'
import { $panelSizes, setPanelSizes } from './state/panels'
import { $project } from './state/project'

export function App() {
	const ref = useRef<HTMLDivElement>(null)
	const { width } = useResize(ref)
	return (
		<Layout>
			<ScrollArea>
				<div className="w-full max-h-svh">
					<ResizablePanelGroup
						orientation="horizontal"
						className="w-full min-h-svh"
						defaultLayout={$panelSizes.value}
						onLayoutChanged={setPanelSizes}
					>
						<ResizablePanel id="tree" defaultSize="25%">
							<div className="w-full h-8 shrink-0">
								<h1 className="px-2 py-1 text-xl font-normal text-muted-foreground tracking-tight transition-colors truncate  w-full overflow-hidden">
									{notNil($project).name}
								</h1>
							</div>
							<DocumentTree />
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel id="values" defaultSize="35%">
							<div className="w-full shrink-0 h-8 p-1" />
							<div className="flex-1 py-2">
								<NodeValues />
							</div>
						</ResizablePanel>
						<ResizableHandle />
						<ResizablePanel
							id="preview"
							defaultSize="40%"
							className="container-size"
						>
							<div className="w-full h-0" ref={ref} />
							<ErrorBoundary fallback={<div>Preview panel has crashed</div>}>
								<PreviewPanel width={width} />
							</ErrorBoundary>
						</ResizablePanel>
					</ResizablePanelGroup>
				</div>
			</ScrollArea>
			<InputDialog />
			<DeletionDialog />
		</Layout>
	)
}
