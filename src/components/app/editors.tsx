import { $openNodes } from '@/state/tree'

export const Editors = () => {
	return (
		<ol className="flex flex-col text-sm px-2 grid-lines">
			{$openNodes.value.map(node => (
				<li key={node.id} className="h-7 flex flex-row items-center">
					<span>{node.name}</span>
				</li>
			))}
		</ol>
	)
}
