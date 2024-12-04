import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { notNil, safeSignal, setSignal } from '@/lib/utils'
import { $nodeSettingsMap, saveNodeSettings } from '@/state/node-settings'
import { type TreeNode, refocus } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'
import type { ZodRawShape } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { ZodForm } from '../zod-form/zod-form'
import { nodePropertiesForm } from './utils'

const $dialogOpen = signal(false)
const $node = signal<TreeNode>()

export const openNodeProperties: (node: TreeNode) => void = pipe(
	setSignal($node),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

export const NodeProperties = <T extends ZodRawShape>() => {
	const [formApi, ref] = useFormState<T>()
	const dialogClose = pipe(close, refocus)
	const oldValue = safeSignal($nodeSettingsMap, safeSignal($node, 'id'))

	return (
		$node.value && (
			<Dialog open={$dialogOpen.value}>
				<DialogContent close={dialogClose} className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Node properties</DialogTitle>
						<DialogDescription>
							Configure how node values will be displayed and edited.
						</DialogDescription>
					</DialogHeader>
					<ZodForm
						schema={nodePropertiesForm($node.value)}
						columns={2}
						defaultValues={oldValue}
						onSubmit={pipeAsync(
							settings => ({
								id: oldValue?.id,
								node_id: notNil($node, 'id'),
								settings
							}),
							saveNodeSettings,
							dialogClose
						)}
						ref={ref}
					>
						<DialogFooter className="gap-y-2">
							<Button onClick={close} variant="secondary">
								Cancel
							</Button>
							<Button type="submit" disabled={formApi.isSubmitting}>
								Apply
							</Button>
						</DialogFooter>
					</ZodForm>
				</DialogContent>
			</Dialog>
		)
	)
}
