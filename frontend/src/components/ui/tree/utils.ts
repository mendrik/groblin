import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { F, type Pred, T, T as _ } from 'ramda'
import {} from 'zod'

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([{ type: NodeType.Object }], T),
	caseOf([{ type: NodeType.List }], T),
	caseOf([_], F)
)
