import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { setSignal } from '@/lib/signals'
import { signal } from '@preact/signals-react'
import { pipeAsync } from 'matchblade'
import { F, T, pipe } from 'ramda'
import type { ZodObject, ZodRawShape, ZodType } from 'zod/v4'
import { Button } from '../button'
import { useFormState } from '../zod-form/use-form-state'
import { ZodForm } from '../zod-form/zod-form'

const $dialogOpen = signal(false)
const $dialogProps = signal<DialogProps<any>>(undefined as any)

export type DialogProps<T> = {
	title: string
	description?: string
	defaultValues?: Partial<T>
	schema: ZodType<T>
	callback: (data: T) => any
}

export const openInputDialog: <T>(props: DialogProps<T>) => void = pipe(
	setSignal($dialogProps),
	pipe(T, setSignal($dialogOpen))
)
const close = pipe(F, setSignal($dialogOpen))

export const InputDialog = <T extends ZodRawShape>() => {
	const [formApi, ref] = useFormState<T>()
	if (!$dialogProps.value) {
		return null
	}
	const { title, description, schema, defaultValues, callback } =
		$dialogProps.value

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close} className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<ZodForm
					schema={schema as ZodObject<T>}
					defaultValues={defaultValues}
					onSubmit={pipeAsync(callback, close)}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button type="button" onClick={close} variant="secondary">
							Close
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Ok
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
