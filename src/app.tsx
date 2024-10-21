import './app.css'
import { DocumentTree } from './components/app/document-tree'
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
		<ScrollArea className="w-full h-full">
			<ResizablePanelGroup
				direction="horizontal"
				className="w-full"
				onLayout={setSignal($panelSizes)}
			>
				<ResizablePanel defaultSize={$panelSizes.value[0]}>
					<div className="w-full h-8 shrink-0 border-b" />
					<DocumentTree />
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={$panelSizes.value[1]}>
					<div className="w-full shrink-0 h-8 border-b" />
					<div className="flex-1 py-2">
						<ol className="flex flex-col text-sm px-2 grid-lines">
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
							<li className="h-7 flex flex-row items-center">
								<span>Hallo</span>
							</li>
						</ol>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</ScrollArea>
	)
}
