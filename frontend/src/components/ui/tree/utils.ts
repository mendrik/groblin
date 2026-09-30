import { caseOf, match } from 'matchblade'
import { T as _, F, type Pred, T } from 'ramda'
import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([{ type: NodeType.Object }], T),
	caseOf([{ type: NodeType.List }], T),
	caseOf([_], F)
)
