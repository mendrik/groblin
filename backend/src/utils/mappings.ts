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
import { GraphQLDateTime } from 'graphql-scalars'
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

const GraphQLDateInput = new GraphQLInputObjectType({
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
	caseOf([{ type: NodeType.date }, _], GraphQLDateTime),
	caseOf([{ type: NodeType.choice }, _], (n, c) => c.getEnumType(n.id)),
	caseOf([{ type: NodeType.media }, _], (n, c) => c.getMediaType(n)),
	caseOf([_, _], GraphQLString)
)

export const inputScalarForNode = match<
	[TreeNode, SchemaContext],
	GraphQLInputType
>(
	caseOf([{ type: NodeType.boolean }, _], GraphQLBoolean),
	caseOf([{ type: NodeType.number }, _], GraphQLFloat),
	caseOf([{ type: NodeType.date }, _], GraphQLDateInput),
	caseOf([{ type: NodeType.choice }, _], (n, c) => c.getEnumType(n.id)),
	caseOf([{ type: NodeType.media }, _], GraphQLBoolean),
	caseOf([_, _], GraphQLString)
)
export const jsonForNode = match<[TreeNode, any], JsonValue>(
	caseOf([{ type: NodeType.string }, isStringType], (_, v) => v.content),
	caseOf([{ type: NodeType.color }, isColorType], (_, v) => v.rgba as number[]),
	caseOf([{ type: NodeType.number }, isNumberType], (_, v) => v.figure),
	caseOf([{ type: NodeType.date }, isDateType], (_, v) => v.date.toString()),
	caseOf([{ type: NodeType.choice }, isChoiceType], (_, v) => v.selected),
	caseOf([{ type: NodeType.boolean }, isNil], (_, v) => false),
	caseOf([{ type: NodeType.boolean }, isBooleanType], (_, v) => v.state),
	caseOf([{ type: NodeType.article }, isArticleType], (_, v) => v.content),
	caseOf([{ type: NodeType.media }, isMediaype], () =>
		throwError('Unreachable code')
	),
	caseOf([_, _], () => null)
)
export const dbType = match<[TreeNode], string>(
	caseOf([{ type: NodeType.string }], 'content'),
	caseOf([{ type: NodeType.color }], 'rgba'),
	caseOf([{ type: NodeType.number }], 'figure'),
	caseOf([{ type: NodeType.date }], 'date'),
	caseOf([{ type: NodeType.choice }], 'selected'),
	caseOf([{ type: NodeType.boolean }], 'state'),
	caseOf([{ type: NodeType.article }], 'content'),
	caseOf([{ type: NodeType.media }], 'file')
)

export const dbOperator = match<[string], string>(
	caseOf(['eq'], '=='),
	caseOf(['not'], '<>'),
	caseOf(['rex'], ' like %s%'),
	caseOf(['gt'], '>'),
	caseOf(['lt'], '<'),
	caseOf(['gte'], '>='),
	caseOf(['lte'], '<='),
	caseOf(['contains'], 'in'),
	caseOf(['exists'], 'is not null')
)

const opSet = ['eq', 'not', 'gt', 'lt', 'gte', 'lte']
export const operators: (node: TreeNode) => string[] = match<
	[TreeNode],
	string[]
>(
	caseOf([{ type: NodeType.string }], () => ['eq', 'not', 'rex']),
	caseOf([{ type: NodeType.color }], () => ['eq', 'not']),
	caseOf([{ type: NodeType.number }], () => opSet),
	caseOf([{ type: NodeType.date }], () => opSet),
	caseOf([{ type: NodeType.choice }], () => ['eq', 'not']),
	caseOf([{ type: NodeType.boolean }], () => ['eq']),
	caseOf([{ type: NodeType.article }], () => ['contains', 'exists']),
	caseOf([{ type: NodeType.media }], () => ['exists']),
	caseOf([_], () => [])
)
