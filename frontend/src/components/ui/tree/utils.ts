import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from 'matchblade'
import { F, type Pred, T, T as _ } from 'ramda'

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([{ type: NodeType.Object }], T),
	caseOf([{ type: NodeType.List }], T),
	caseOf([_], F)
)
