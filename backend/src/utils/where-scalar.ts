import type {} from 'graphql'
import { GraphQLScalarType, Kind } from 'graphql'
import { assoc } from 'ramda'

type WhereCondition =
	| [operator: '=' | '!=', value: string | number | boolean | null]
	| [operator: '>' | '<' | '>=' | '<=', value: string | number]
	| [property: string, operator: 'in' | 'not_in', value: string[] | number[]] // Defining the types of value

type WhereObject = Record<string, WhereCondition>

export const WhereObjectScalar = new GraphQLScalarType({
	name: 'WhereObject',
	description:
		'A custom scalar for a record of { string: [property, operator, value] }',

	parseValue(value: unknown): WhereObject {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new Error('Value must anybe a non-null object')
		}
		return value as WhereObject
	},

	serialize(value: unknown): WhereObject {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new Error(
				'Serialized valGraphQLValueNodeue must be a non-null object'
			)
		}
		return value as WhereObject
	},

	parseLiteral(ast: any): WhereObject | null {
		if (ast.kind === Kind.OBJECT) {
			const obj = ast.fields.reduce((obj: WhereObject, field: any) => {
				if (field.value.kind === Kind.VARIABLE) {
					return assoc(field.name.value, field.value.name.value, obj)
				}
				return obj
			}, {})
		}
		return null
	}
})
