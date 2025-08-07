import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from 'matchblade'
import { T as _ } from 'ramda'
import { type ZodObject, object } from 'zod/v4'
import { ChoiceProps } from './choice'
import { ColorProps } from './colors'
import { DateProps } from './dates'
import { ListProps } from './list'
import { MediaProps } from './media'
import { NumberProps } from './numbers'
import { StringProps } from './strings'

export const propSchema: (node: TreeNode) => ZodObject<any> = match(
	caseOf([{ type: NodeType.List }], () => ListProps),
	caseOf([{ type: NodeType.Number }], () => NumberProps),
	caseOf([{ type: NodeType.Color }], () => ColorProps),
	caseOf([{ type: NodeType.Date }], () => DateProps),
	caseOf([{ type: NodeType.String }], () => StringProps),
	caseOf([{ type: NodeType.Media }], () => MediaProps),
	caseOf([{ type: NodeType.Choice }], () => ChoiceProps),
	caseOf([_], () => object({}))
)
