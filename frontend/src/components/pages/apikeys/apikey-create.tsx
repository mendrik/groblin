import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { useFormState } from '@/components/ui/zod-form/use-form-state'
import {  metas } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { setSignal } from '@/lib/signals'
import { createApiKey } from '@/state/apikeys'
import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { pipeAsync } from 'matchblade'
import { F, pipe } from 'ramda'
import { infer as TypeOf, date, strictObject, string } from 'zod/v4'

const $dialogOpen = signal(false)

export const openApiKeyCreate = () => {
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

const newApiKeySchema = strictObject({
	name: string().register(metas, {
		label: 'Name',
		editor: EditorType.Input,
		description: 'Name the key'
	}),
	expires: date().optional().register(metas, {
		label: 'Expires',
		description:
			'You can limit the validity of the key by setting an expiration date.',
		editor: EditorType.Date
	})
})

export type NewApiKeySchema = TypeOf<typeof newApiKeySchema>

const createApiKeyCommand: (data: NewApiKeySchema) => Promise<any> =
	pipeAsync(createApiKey)

export const ApiKeyCreate = () => {
	const [formApi, ref] = useFormState<NewApiKeySchema>()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Create new api key</DialogTitle>
					<DialogDescription>
						Allows to create a new api key for this project
					</DialogDescription>
				</DialogHeader>
				<ZodForm
					schema={newApiKeySchema}
					columns={2}
					onSubmit={pipe(createApiKeyCommand, close)}
					ref={ref}
				>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit" disabled={formApi.isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
