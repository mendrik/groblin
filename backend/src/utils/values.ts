import { caseOf, match } from '@shared/utils/match.ts'
import { T as _ } from 'ramda'
import { isString, resolveP } from 'ramda-adjunct'
import type { Value } from 'src/resolvers/value-resolver.ts'
import { isJsonObject } from './json.ts'

const isImage = ({ value }: Value) =>
	isJsonObject(value) && isString(value.contentType)
		? value.contentType.startsWith('image/')
		: false

const appendS3Url = async (value: Value): Promise<Value> =>
	Object.assign(value, {
		value:
			value.value != null
				? Object.assign(value.value, {
						url: `https://s3.amazonaws.com/${process.env.S3_BUCKET}/${value.id}`
					})
				: undefined
	})

export const enrichValue = match<[Value], Promise<Value>>(
	caseOf([isImage], appendS3Url),
	caseOf([_], resolveP<Value>)
)
