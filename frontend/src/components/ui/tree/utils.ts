import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { F, type Pred, T, T as _ } from 'ramda'
import { type ZodObject, object } from 'zod'
import { ListProps } from './properties/list'
import { NumberProps } from './properties/numbers'

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([{ type: NodeType.Object }], T),
	caseOf([{ type: NodeType.List }], T),
	caseOf([_], F)
)

export const nodePropertiesForm: (node: TreeNode) => ZodObject<any> = match(
	caseOf([{ type: NodeType.List }], () => ListProps),
	caseOf([{ type: NodeType.Number }], () => NumberProps),
	caseOf([_], () => object({}))
)
