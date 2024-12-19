import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { cn } from '@/lib/utils'
import type { TreeNode } from '@/state/tree'
import { rgb } from 'chroma-js'
import { objOf, pipe } from 'ramda'
import { Button } from '../button'
import { openColorPicker } from '../color-picker'
import { editorKey, save } from './value-editor'

type ColorValue = Value & {
	value: {
		rgba: number[]
	}
}

type OwnProps = {
	node: TreeNode
	value?: ColorValue
}

export const ColorEditor = ({ node, value }: OwnProps) => {
	const chroma = rgb.apply(null, value?.value.rgba ?? [0, 0, 0, 1])
	const backgroundColor = chroma.css()
	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<div className="flex flex-row gap-2">
				<Button
					key={editorKey(node, value)}
					variant="ghost"
					type="button"
					className={cn(
						'h-4 w-4 p-0 rounded-sm ml-1',
						!value && 'border border-border'
					)}
					style={{ backgroundColor }}
					onClick={() =>
						openColorPicker({
							callback: pipe(objOf('rgba'), save(node, value)),
							color: backgroundColor
						})
					}
				/>
				<span className="text-muted-foreground">
					{chroma.hex().toUpperCase()}
				</span>
			</div>
		</KeyListener>
	)
}
