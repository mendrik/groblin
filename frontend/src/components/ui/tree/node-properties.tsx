import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/utils'
import { type TreeNode, refocus } from '@/state/tree'
import { signal } from '@preact/signals-react'
import { pipeTap } from '@shared/utils/pipe-tap'
import { F, T, pipe, tap } from 'ramda'
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

const saveNodeSettingsCommand: <T>(data: T) => Promise<void> = pipeTap(
	tap(console.log)
)

export const NodeProperties = <T extends ZodRawShape>() => {
	const [formApi, ref] = useFormState<T>()
	const dialogClose = pipe(close, refocus)

	return (
		$node.value && (
			<Dialog open={$dialogOpen.value}>
				<DialogContent close={dialogClose}>
					<DialogHeader>
						<DialogTitle>Node properties</DialogTitle>
						<DialogDescription>
							Please configure how node values will be displayed and edited.
						</DialogDescription>
					</DialogHeader>
					<ZodForm
						schema={nodePropertiesForm($node.value)}
						columns={2}
						onSubmit={pipe(saveNodeSettingsCommand, dialogClose)}
						onError={console.error}
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
