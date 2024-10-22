import './app.css'
import { DocumentTree } from './components/app/document-tree'
import { Editors } from './components/app/editors'
import { Tags } from './components/app/tags'
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
					<div className="w-full h-11 shrink-0" />
					<DocumentTree />
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={$panelSizes.value[1]}>
					<div className="w-full shrink-0 h-11 p-1">
						<Tags />
					</div>
					<div className="flex-1 py-2">
						<Editors />
					</div>
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize={$panelSizes.value[2]}>
					Preview
				</ResizablePanel>
			</ResizablePanelGroup>
		</ScrollArea>
	)
}
