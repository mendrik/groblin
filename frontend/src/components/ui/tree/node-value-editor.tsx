import type { Value } from '@/gql/graphql'
import { match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import type { Fn } from '@tp/functions.ts'
import { apply, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import {} from 'zod'
import {} from '../select'

type OwnProps = {
	node: TreeNode
	value: Value
}

type Args = readonly [TreeNode, Value]

const matcher = match<Args, ReactNode>()

const propsToArgs = ({ node, value }: OwnProps) => [node, value] as Args

export const ValueEditor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
