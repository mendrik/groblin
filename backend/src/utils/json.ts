import { isObject } from 'ramda-adjunct'
import type { JsonObject, JsonValue } from 'src/database/schema.ts'

export const isJsonObject: (json: JsonValue) => json is JsonObject =
	isObject as any
