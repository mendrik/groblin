import './app.css'
import { DocumentTree } from './components/app/document-tree'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'
import { ScrollArea } from './components/ui/scroll-area'
import {} from './state/tree'

export function App() {
	return (
		<ResizablePanelGroup direction="horizontal" className="w-full">
			<ResizablePanel defaultSize={25}>
				<ScrollArea className="w-full p-2 pl-0 pr-1">
					<DocumentTree />
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={75} />
		</ResizablePanelGroup>
	)
}
