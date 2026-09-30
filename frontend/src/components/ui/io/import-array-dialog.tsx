import { ImportKind } from '@/gql/graphql'
import type { TreeNode } from '@/state/tree'
import { ContentImportDialog, openContentImport } from './content-import-dialog'

export const openImportJson = (node: TreeNode) =>
	openContentImport(node, ImportKind.Array)
export const ImportArrayDialog = ContentImportDialog
