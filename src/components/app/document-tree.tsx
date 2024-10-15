import { $root } from '@/state/tree'
import { Tree } from '../ui/tree/tree'

export const DocumentTree = () => {
	const root = $root.value
	if (!root) {
		return null
	}
	return (
		<div className="w-full h-full">
			<Tree root={root} />
		</div>
	)
}
