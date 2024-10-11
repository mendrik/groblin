import './app.css'
import { DocumentTree } from './components/app/document-tree'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'

export function App() {
	return (
		<ResizablePanelGroup direction="horizontal" className="w-full">
			<ResizablePanel defaultSize={25}>
				<DocumentTree />
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={75}></ResizablePanel>
		</ResizablePanelGroup>
	)
}
