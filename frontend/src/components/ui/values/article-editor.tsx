import type { Value } from '@/gql/graphql'
import type { ArticleType } from '@shared/json-value-types'
import MDEditor from '@uiw/react-md-editor'
import { Eye } from 'lucide-react'
import {} from 'ramda'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { MicroIcon } from '../random/micro-icon'
import type { ValueEditor } from './value-editor'

type ArticleValue = Omit<Value, 'value'> & { value: ArticleType }

export const ArticleEditor: ValueEditor<ArticleValue> = ({ value }) => {
	return (
		<Popover>
			<PopoverTrigger>
				<MicroIcon icon={Eye} />
			</PopoverTrigger>
			<PopoverContent className="w-[600px] h-[400px]">
				<MDEditor.Markdown source={value?.value.content} />
			</PopoverContent>
		</Popover>
	)
}
