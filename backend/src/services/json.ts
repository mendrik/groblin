import type { Json } from 'src/database/schema.ts'

export function* traverse(
	json: Json | undefined,
	parents: (string | number)[] = []
): Generator<{
	key: (string | number)[]
	value: any
}> {
	if (typeof json === 'object' && json != null) {
		if (Array.isArray(json)) {
			for (let i = 0; i < json.length; i++) {
				yield* traverse(json[i], [...parents, i])
			}
		} else {
			for (const key of Object.keys(json)) {
				yield* traverse(json[key], [...parents, key])
			}
		}
	} else {
		if (json != null) {
			yield {
				key: parents,
				value: json
			}
		}
	}
}
