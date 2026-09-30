import type { JsonObject, JsonValue } from '../database/schema.ts'

export const isJsonObject = (json: JsonValue): json is JsonObject =>
	typeof json === 'object' && json !== null && !Array.isArray(json)
