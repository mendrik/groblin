import KeyListener from '@/components/utils/key-listener'
import type { Value } from '@/gql/graphql'
import { stopPropagation } from '@/lib/dom-events'
import { relativeTime } from '@/lib/relative-time'
import type { TreeNode } from '@/state/tree'
import { IconCalendar } from '@tabler/icons-react'
import { parseJSON } from 'date-fns'
import { objOf, pipe, when } from 'ramda'
import { isString } from 'ramda-adjunct'
import { openDatePicker } from '../date-picker/date-picker-dialog'
import { MicroIcon } from '../random/micro-icon'
import { save } from './value-editor'

type DateValue = Value & {
	value: {
		date: Date
	}
}

type OwnProps = {
	node: TreeNode
	value?: DateValue
}

const safeParse: (date?: string) => Date | undefined = when(isString, parseJSON)

export const DateEditor = ({ node, value }: OwnProps) => {
	const date = safeParse(value?.value.date)

	return (
		<KeyListener onArrowLeft={stopPropagation} onArrowRight={stopPropagation}>
			<div className="flex items-center flex-row gap-1 h-7 whitespace-nowrap">
				{date && <span>{relativeTime({})(date)}</span>}
				<MicroIcon
					icon={IconCalendar}
					onClick={() =>
						openDatePicker({
							date,
							callback: pipe(objOf('date'), save(node, value))
						})
					}
				/>
			</div>
		</KeyListener>
	)
}
