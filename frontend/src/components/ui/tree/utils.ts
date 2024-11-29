import { NodeType } from '@/gql/graphql'
import { caseOf, match } from '@/lib/match'
import type { TreeNode } from '@/state/tree'
import { EditorType } from '@shared/enums'
import { F, type Pred, T, T as _ } from 'ramda'
import { type ZodObject, boolean, object, string } from 'zod'
import { asField } from '../zod-form/utils'

export const canHaveChildren: Pred<[TreeNode]> = match(
	caseOf([{ type: NodeType.Object }], T),
	caseOf([{ type: NodeType.List }], T),
	caseOf([_], F)
)

export const nodePropertiesForm: (node: TreeNode) => ZodObject<any> = match(
	caseOf([{ type: NodeType.Number }], () =>
		object({
			mask: asField(string().optional(), {
				label: 'Input Mask',
				editor: EditorType.Input,
				span: 2
			}),
			integers: asField(boolean().default(false), {
				label: 'Integers',
				editor: EditorType.Switch
			}),
			required: asField(boolean().default(false), {
				label: 'Required',
				editor: EditorType.Switch
			})
		})
	),
	caseOf([_], () => object({}))
)
