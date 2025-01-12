import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/signals'
import { notNil } from '@/lib/signals'
import { $nodeSettingsMap, saveNodeSettings } from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { pipeAsync } from '@shared/utils/pipe-async'
import { F, T, pipe } from 'ramda'
import type { ZodRawShape } from 'zod'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { ZodForm } from '../zod-form/zod-form'
import { propSchema } from './properties/props-schema'

const $dialogOpen = signal(false)
const $node = signal<TreeNode>()

export const openNodeProperties: (node: TreeNode) => void = pipe(
	setSignal($node),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

export const NodeProperties = <T extends ZodRawShape>() => {
	const [formApi, ref] = useFormState<T>()
	if ($node.value === undefined) return null
	const oldValue = $nodeSettingsMap.value[notNil($node, 'id')]

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close} className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Node properties</DialogTitle>
					<DialogDescription>Configure node type editor</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={propSchema($node.value)}
					columns={2}
					defaultValues={oldValue?.settings}
					onSubmit={pipeAsync(
						settings => ({
							id: oldValue?.id,
							node_id: notNil($node, 'id'),
							settings
						}),
						saveNodeSettings,
						close
					)}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button type="button" onClick={close} variant="secondary">
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
}
