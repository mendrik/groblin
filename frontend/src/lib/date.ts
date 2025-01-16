import { caseOf, match } from '@shared/utils/match'
import { formatDate as format, parseJSON, toDate } from 'date-fns'
import { Maybe } from 'purify-ts'
import { T as _, pipe, tryCatch, unless } from 'ramda'
import { isDate, isString, isValidDate } from 'ramda-adjunct'

export const validDate = unless(isValidDate, () => undefined)

export const safeParse = match<[Date | string | undefined], Date | undefined>(
	caseOf([isDate], validDate),
	caseOf([isString], pipe(parseJSON, validDate)),
	caseOf([_], () => undefined)
)

export const safeFormat = tryCatch(format, () => undefined)

export const formatDate = (date?: Date) =>
	Maybe.fromNullable(date).map(d => format(d, 'd.M.yyyy'))

export const formatIsoDate = (date?: string) =>
	Maybe.fromNullable(date).map(toDate).chain(formatDate).orDefault('')
