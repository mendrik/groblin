import { signal } from '@preact/signals-react'
import { pipeAsync } from 'matchblade'
import { F, pipe } from 'ramda'
import { record, string, unknown } from 'zod'
import type { ZodRawShape } from 'zod/v4'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import type { NodeSettings } from '@/gql/graphql'
import { notNil, setSignal } from '@/lib/signals'
import { requireManage } from '@/state/access'
import {
	$nodeSettingsMap,
	saveNodeSettings,
	settingsSaves,
	stageNodeSettings
} from '@/state/node-settings'
import type { TreeNode } from '@/state/tree'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { ZodForm } from '../zod-form/zod-form'
import { propSchema } from './properties/props-schema'

const $dialogOpen = signal(false)
const $node = signal<TreeNode>()
const $baseline = signal<NodeSettings>()

export const openNodeProperties = (node: TreeNode) => {
	requireManage()
	$node.value = node
	$baseline.value = $nodeSettingsMap.peek()[node.id]
	$dialogOpen.value = true
}
const close = pipe(F, setSignal($dialogOpen))

export const NodeProperties = <_T extends ZodRawShape>() => {
	const [formApi, ref] = useFormState()
	if ($node.value === undefined) return null
	const oldValue = $baseline.value
	const draft = settingsSaves.edits.value.find(
		edit => edit.data.node_id === $node.value?.id
	)
	const data = (settings: unknown) => ({
		id: oldValue?.id,
		node_id: notNil($node, 'id'),
		expectedRevision: oldValue?.revision ?? 0,
		settings: record(string(), unknown()).parse(settings)
	})

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
					defaultValues={draft?.data.settings ?? oldValue?.settings}
					onValueChange={settings => {
						stageNodeSettings(data(settings))
					}}
					onSubmit={pipeAsync(data, saveNodeSettings, close)}
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
