import { caseOf, match } from '@shared/utils/match'
import { T as _, both, curry, flip, lt } from 'ramda'

const second = 1000
const minute = 60 * 1000
const hour = minute * 60
const day = hour * 24
const week = day * 7
const month = day * 30
const year = day * 365

type Options = {
	reference?: Date
	locale?: Intl.UnicodeBCP47LocaleIdentifier
	time?: boolean
}

const lessThan = flip(lt)
const divisbleBy = (val: number) => (num: number) =>
	Math.round(num / day) % val === 0

export const relativeTime = curry(
	(
		{ reference = new Date(), locale = 'en', time = false }: Options,
		paramDate: Date
	): string => {
		const date = new Date(paramDate.getTime())
		const intl = new Intl.RelativeTimeFormat(locale, {
			numeric: 'auto'
		})

		if (!time) {
			reference.setHours(0, 0, 0, 0)
			date.setHours(0, 0, 0, 0)
		}

		const difference = reference.getTime() - date.getTime()
		const elapsed = Math.abs(difference)
		const sign = Math.sign(-difference)
		const formatRelativeTime = match<[number], string>(
			caseOf([lessThan(minute)], () =>
				intl.format(sign * Math.round(elapsed / second), 'second')
			),
			caseOf([lessThan(hour)], () =>
				intl.format(sign * Math.round(elapsed / minute), 'minute')
			),
			caseOf([lessThan(day)], () =>
				intl.format(sign * Math.round(elapsed / hour), 'hour')
			),
			caseOf([both(lessThan(month), divisbleBy(7))], () =>
				intl.format(sign * Math.round(elapsed / week), 'week')
			),
			caseOf([lessThan(month)], () =>
				intl.format(sign * Math.round(elapsed / day), 'day')
			),
			caseOf([lessThan(year)], () =>
				intl.format(sign * Math.round(elapsed / month), 'month')
			),
			caseOf([_], () => intl.format(sign * Math.round(elapsed / year), 'year'))
		)

		return formatRelativeTime(elapsed)
	}
)
