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
		<ResizablePanelGroup
			direction="horizontal"
			className="w-full"
			onLayout={setSignal($panelSizes)}
		>
			<ResizablePanel defaultSize={$panelSizes.value[0]}>
				<ScrollArea className="w-full p-2 pl-0 pr-1">
					<DocumentTree />
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={$panelSizes.value[1]} />
		</ResizablePanelGroup>
	)
}
