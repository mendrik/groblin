import {
	GraphQLError,
	Kind,
	type SelectionSetNode,
	type ValidationRule
} from 'graphql'

/** Bound expanded selections, including repeated fragment spreads and aliases. */
export const queryLimits: ValidationRule = context => ({
	Document(document) {
		const fragments = new Map(
			document.definitions
				.filter(def => def.kind === Kind.FRAGMENT_DEFINITION)
				.map(def => [def.name.value, def])
		)
		let fields = 0
		const walk = (
			set: SelectionSetNode,
			depth: number,
			seen: Set<string>
		): boolean => {
			if (depth > 12) return false
			for (const selection of set.selections) {
				if (++fields > 200) return false
				if (selection.kind === Kind.FRAGMENT_SPREAD) {
					const name = selection.name.value
					const fragment = fragments.get(name)
					if (seen.has(name)) return false
					if (
						fragment &&
						!walk(fragment.selectionSet, depth, new Set([...seen, name]))
					)
						return false
				} else if (
					selection.selectionSet &&
					!walk(
						selection.selectionSet,
						depth + (selection.kind === Kind.FIELD ? 1 : 0),
						seen
					)
				)
					return false
			}
			return true
		}
		for (const definition of document.definitions) {
			if (
				definition.kind === Kind.OPERATION_DEFINITION &&
				!walk(definition.selectionSet, 1, new Set())
			) {
				context.reportError(
					new GraphQLError('Query exceeds depth or field limit')
				)
				break
			}
		}
	}
})
