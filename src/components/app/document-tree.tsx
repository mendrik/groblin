import { $root } from '@/state/tree'
import { Tree } from '../ui/tree'

export const DocumentTree = () => {
	const root = $root.value
	if (!root) {
		return null
	}
	return (
		<div className="w-full h-full rct-dark pr-1">
			<Tree root={root} />
		</div>
	)
}
