import type { Value } from '@/gql/graphql'
import type { ArticleType } from '@shared/json-value-types'
import { Eye } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { ScrollArea } from '../scroll-area'
import type { ValueEditor } from './value-editor'

type ArticleValue = Omit<Value, 'value'> & { value: ArticleType }

export const ArticleEditor: ValueEditor<ArticleValue> = ({ value }) => {
	return (
		<Popover>
			<PopoverTrigger>
				<Eye
					className="shrink-0 text-muted-foreground hover:text-primary aspect-square"
					strokeWidth={1}
					size={20}
					absoluteStrokeWidth
				/>
			</PopoverTrigger>
			<PopoverContent className="w-[600px] bg-background p-0">
				<ScrollArea className="h-[400px] p-8">
					<article className="prose dark:prose-invert" data-color-mode="dark">
						Hallo
					</article>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	)
}
