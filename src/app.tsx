import { useState } from 'preact/hooks'
import preactLogo from './assets/preact.svg'
import viteLogo from '/vite.svg'
import './app.css'
import { Button } from './components/ui/button'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'

export function App() {
	return (
		<ResizablePanelGroup direction="horizontal" className="w-full">
			<ResizablePanel defaultSize={25} />
			<ResizableHandle />
			<ResizablePanel defaultSize={75} />
		</ResizablePanelGroup>
	)
}
