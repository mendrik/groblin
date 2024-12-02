import { cn } from '@/lib/utils'
import { parse } from 'date-fns'
import { formatDate } from 'date-fns'
import type { HTMLAttributes } from 'react'
import { IMask, IMaskMixin } from 'react-imask'

const format = 'd.M.yyyy'

const MaskedStyledInput = IMaskMixin(({ inputRef, className, ...props }) => (
	<input
		ref={inputRef as any}
		className={cn(
			'w-[120px] bg-transparent border border-border appearance-none rounded-sm px-2 py-1',
			className
		)}
		{...props}
	/>
))

type OwnProps = { date: Date } & HTMLAttributes<HTMLInputElement>

export const MaskedDateInput = ({ date, className }: OwnProps) => {
	return (
		<MaskedStyledInput
			type="text"
			mask={Date}
			lazy={false}
			pattern={format}
			placeholderChar="_"
			value={formatDate(date, format)}
			placeholder={format}
			className={className}
			format={(d: Date) => formatDate(d, format)}
			parse={(date: string) => parse(date, format, new Date())}
			blocks={{
				yyyy: { mask: IMask.MaskedRange, from: 0, to: 2100 },
				M: { mask: IMask.MaskedRange, from: 1, to: 12 },
				d: { mask: IMask.MaskedRange, from: 1, to: 31 }
			}}
		/>
	)
}
