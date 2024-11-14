import { NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import { F, type Pred, T, T as _ } from 'ramda'

const isType = (type: NodeType) => (node: TreeNode) => node.type === type

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([isType(NodeType.Object)], T),
	caseOf([_], F)
)
