import { Tree } from 'react-complex-tree'
import 'react-complex-tree/lib/style-modern.css'

export const DocumentTree = () => {
	return (
		<div class="w-full h-full rct-dark pr-1">
			<Tree treeId="documentTree" rootItem="1" />
		</div>
	)
}
