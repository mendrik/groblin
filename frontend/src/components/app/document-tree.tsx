import { notNil } from '@/lib/utils'
import { $root } from '@/state/tree'
import { Tree } from '../ui/tree/tree'

export const DocumentTree = () => {
	const root = notNil($root)
	return (
		<div className="w-full h-full py-2 flex-1">
			<Tree root={root} />
		</div>
	)
}
