import { throwError } from '@shared/errors.ts'
import type {
	ArticleType,
	BooleanType,
	ChoiceType,
	ColorType,
	DateType,
	MediaType,
	NumberType,
	StringType
} from '@shared/json-value-types.ts'
import { caseOf, match } from '@shared/utils/match.ts'
import chroma from 'chroma-js'
import { format } from 'date-fns'
import {
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLInputObjectType,
	type GraphQLInputType,
	GraphQLInt,
	GraphQLList,
	type GraphQLOutputType,
	GraphQLString
} from 'graphql'
import { type RawBuilder, sql } from 'kysely'
import { T as _, isNil } from 'ramda'
import type { JsonValue } from 'src/database/schema.ts'
import type { SchemaContext } from 'src/services/schema-context.ts'
import { NodeType, type TreeNode } from 'src/types.ts'

const hasValue = <T>(value: T | null): value is T => value != null

const isStringType = hasValue<StringType>
const isNumberType = hasValue<NumberType>
const isColorType = hasValue<ColorType>
const isDateType = hasValue<DateType>
const isMediaype = hasValue<MediaType>
const isChoiceType = hasValue<ChoiceType>
const isBooleanType = hasValue<BooleanType>
const isArticleType = hasValue<ArticleType>

export const GraphQLDateInput = new GraphQLInputObjectType({
	name: 'DateInput',
	fields: {
		year: { type: GraphQLInt },
		month: { type: GraphQLInt },
		day: { type: GraphQLInt }
	}
})

export const outputScalarForNode = match<
	[TreeNode, SchemaContext],
	GraphQLOutputType
>(
	caseOf([{ type: NodeType.boolean }, _], GraphQLBoolean),
	caseOf([{ type: NodeType.number }, _], GraphQLFloat),
	caseOf([{ type: NodeType.color }, _], new GraphQLList(GraphQLInt)),
	caseOf([{ type: NodeType.choice }, _], (n, c) => c.getEnumType(n.id)),
	caseOf([{ type: NodeType.media }, _], (n, c) => c.getMediaType(n)),
	caseOf([_, _], GraphQLString)
)

export const inputScalarForNode = match<
	[TreeNode, string, SchemaContext],
	GraphQLInputType
>(
	caseOf([{ type: NodeType.boolean }, _, _], GraphQLBoolean),
	caseOf([{ type: NodeType.number }, _, _], GraphQLFloat),
	caseOf([{ type: NodeType.date }, _, _], GraphQLDateInput),
	caseOf([{ type: NodeType.choice }, _, _], (n, _, c) => c.getEnumType(n.id)),
	caseOf([{ type: NodeType.media }, _, _], GraphQLBoolean),
	caseOf([_, 'not', _], GraphQLString),
	caseOf([_, _, _], GraphQLString)
)
export const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isNil], (_, v) => false),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([{ type: NodeType.article }, isArticleType], (_, v) => v.content),
	caseOf([{ type: NodeType.media }, isMediaype], () =>
		throwError('Unreachable code')
	),
	caseOf([_, _], () => null)
)
export const jsonField = match<[TreeNode], string>(
	caseOf([{ type: NodeType.string }], 'content'),
	caseOf([{ type: NodeType.color }], 'rgba'),
	caseOf([{ type: NodeType.number }], 'figure'),
	caseOf([{ type: NodeType.date }], 'date'),
	caseOf([{ type: NodeType.choice }], 'selected'),
	caseOf([{ type: NodeType.boolean }], 'state'),
	caseOf([{ type: NodeType.article }], 'content'),
	caseOf([{ type: NodeType.media }], 'file')
)

export const opMap: Record<Operator, string> = {
	eq: '=',
	not: '!=',
	rex: '~',
	gt: '>',
	lt: '<',
	gte: '>=',
	lte: '<='
}

export type Operand = keyof typeof opMap

type Operator = 'eq' | 'not' | 'gt' | 'lt' | 'gte' | 'lte' | 'rex'

const opSet: Operator[] = ['eq', 'not', 'gt', 'lt', 'gte', 'lte']
export const operators = match<[TreeNode], Operator[]>(
	caseOf([{ type: NodeType.string }], () => ['eq', 'not', 'rex']),
	caseOf([{ type: NodeType.color }], () => ['eq', 'not']),
	caseOf([{ type: NodeType.number }], () => opSet),
	caseOf([{ type: NodeType.date }], () => opSet),
	caseOf([{ type: NodeType.choice }], () => ['eq', 'not']),
	caseOf([{ type: NodeType.boolean }], () => ['eq']),
	caseOf([{ type: NodeType.article }], () => ['rex']),
	caseOf([{ type: NodeType.media }], () => ['not']),
	caseOf([_], () => [])
)

const isOperator = (op: any): op is Operator => Object.keys(opMap).includes(op)

export const dbValue = match<[string, TreeNode, any], RawBuilder<any>>(
	caseOf(['eq', { type: NodeType.color }, chroma.valid], (_, __, v) => {
		const rgba = chroma(v).rgba()
		return sql.raw(`'[${rgba.join(',')}]'::jsonb`)
	}),
	caseOf([isOperator, { type: NodeType.date }, _], (o, __, v) => {
		const { year = 0, month = 0, day = 1 } = v
		const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd')
		return sql.val(date)
	}),
	caseOf([isOperator, _, _], (_, __, v) => sql.val(v))
)

export const arrow = match<[TreeNode, any], string>(
	caseOf([_, isNil], '->'),
	caseOf([{ type: NodeType.object }, _], '->'),
	caseOf([{ type: NodeType.color }, _], '->'),
	caseOf([{ type: NodeType.list }, _], '->'),
	caseOf([_, _], '->>')
)
