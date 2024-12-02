import { cn } from '@/lib/utils'
import { parse } from 'date-fns'
import { formatDate } from 'date-fns'
import type { HTMLAttributes } from 'react'
import { IMask, IMaskMixin } from 'react-imask'

const MaskedStyledInput = IMaskMixin(({ inputRef, className, ...props }) => (
	<input
		ref={inputRef as any}
		className={cn(
			'w-[115px] bg-transparent border border-border appearance-none rounded-sm px-2 py-1',
			className
		)}
		{...props}
	/>
))

export const MaskedDateInput = ({
	className
}: HTMLAttributes<HTMLInputElement>) => (
	<MaskedStyledInput
		type="text"
		mask={Date}
		className={className}
		pattern={'dd.MM.Y'}
		format={formatDate}
		placeholder="DD.MM.YYYY"
		parse={parse}
		blocks={{
			YYYY: {
				mask: IMask.MaskedRange,
				from: 1970,
				to: 2030
			},
			MM: {
				mask: IMask.MaskedRange,
				from: 1,
				to: 12
			},
			DD: {
				mask: IMask.MaskedRange,
				from: 1,
				to: 31
			},
			HH: {
				mask: IMask.MaskedRange,
				from: 0,
				to: 23
			},
			mm: {
				mask: IMask.MaskedRange,
				from: 0,
				to: 59
			}
		}}
	/>
)
