import { NodeType, type Value } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import type { Fn } from '@tp/functions'
import { T as _, apply, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import {} from 'zod'
import {} from '../select'
import { ListEditor } from './list-editor'

type OwnProps = {
	node: TreeNode
	value?: Value
}

type Args = readonly [TreeNode, Value | undefined]

const matcher = match<Args, ReactNode>(
	caseOf([{ type: NodeType.List }, _], node => <ListEditor node={node} />),
	caseOf([_, _], node => node.name)
)

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
