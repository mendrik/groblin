import type { Json } from 'src/database/schema.ts'
import type { Node } from 'src/resolvers/node-resolver.ts'

enum Case {
	NODE_MISSING = 'NODE_MISSING',
	NODE_EXTRA = 'NODE_EXTRA',
	TYPE_DIFFERENCE = 'TYPE_DIFFERENCE'
}

type Difference = {
	parent: Node | undefined
	json: Json | undefined
	case: Case
}

export function* compare(
	node: Node,
	json: Json,
): Generator<Difference> {
	match<[Node, Json]>(
		caseOf([], () => )
	)
}
