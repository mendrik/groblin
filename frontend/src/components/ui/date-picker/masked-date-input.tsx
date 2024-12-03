import { cn, setSignal } from '@/lib/utils'
import { parse } from 'date-fns'
import { format } from 'date-fns/fp'
import { isNil, unless } from 'ramda'
import type { HTMLAttributes } from 'react'
import { IMask, IMaskMixin } from 'react-imask'
import { $viewDate } from './date-picker-dialog'

const dateFormat = 'dd.MM.yyyy'

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
			key={date.getTime()}
			mask={Date}
			unmask="typed"
			lazy={false}
			pattern={dateFormat}
			placeholderChar="_"
			defaultValue={format(dateFormat, date)}
			placeholder={dateFormat}
			className={className}
			format={format(dateFormat)}
			onAccept={unless(isNil, setSignal($viewDate))}
			parse={(d: string) => parse(d, dateFormat, new Date())}
			blocks={{
				yyyy: { mask: IMask.MaskedRange, from: 0, to: 2100 },
				MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
				dd: { mask: IMask.MaskedRange, from: 1, to: 31 }
			}}
		/>
	)
}
