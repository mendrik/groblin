import { ImportKind } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { openContentImport } from './content-import-dialog'

export const openImportJson = (node: TreeNode) =>
	openContentImport(node, ImportKind.Object)
