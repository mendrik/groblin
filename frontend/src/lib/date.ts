import { caseOf, match } from '@shared/utils/match'
import { formatDate, parseJSON } from 'date-fns'
import { T as _, pipe, tryCatch, unless } from 'ramda'
import { isDate, isString, isValidDate } from 'ramda-adjunct'

export const validDate = unless(isValidDate, () => undefined)

export const safeParse = match<[Date | string | undefined], Date | undefined>(
	caseOf([isDate], validDate),
	caseOf([isString], pipe(parseJSON, validDate)),
	caseOf([_], () => undefined)
)

export const safeFormat = tryCatch(formatDate, () => undefined)
