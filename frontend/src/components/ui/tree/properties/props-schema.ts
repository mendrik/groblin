import { NodeType } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { caseOf, match } from '@shared/utils/match'
import { T as _ } from 'ramda'
import { type ZodObject, object } from 'zod'
import { ColorProps } from './colors'
import { ListProps } from './list'
import { NumberProps } from './numbers'

export const propSchema: (node: TreeNode) => ZodObject<any> = match(
	caseOf([{ type: NodeType.List }], () => ListProps),
	caseOf([{ type: NodeType.Number }], () => NumberProps),
	caseOf([{ type: NodeType.Color }], () => ColorProps),
	caseOf([_], () => object({}))
)
