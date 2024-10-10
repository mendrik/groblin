import { useState } from 'preact/hooks'
import viteLogo from '/vite.svg'
import preactLogo from './assets/preact.svg'
import './app.css'
import { useSignal } from '@preact/signals'
import { Button } from './components/ui/button'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup
} from './components/ui/resizable'
import { $root } from './state/tree'

export function App() {
	return (
		<ResizablePanelGroup direction="horizontal" className="w-full">
			<ResizablePanel defaultSize={25} />
			<ResizableHandle />
			<ResizablePanel defaultSize={75}>
				<div>{JSON.stringify($root.value)}</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	)
}
