import { signal } from '@preact/signals-react'
import { EditorType } from '@shared/enums'
import { F, pipe } from 'ramda'
import { useState } from 'react'
import {
	boolean,
	date,
	strictObject,
	string,
	type infer as TypeOf
} from 'zod/v4'
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
import { metas } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { setSignal } from '@/lib/signals'
import { createApiKey } from '@/state/apikeys'

const $dialogOpen = signal(false)

export const openApiKeyCreate = () => {
	setSignal($dialogOpen, true)
}
const close = pipe(F, setSignal($dialogOpen))

const newApiKeySchema = strictObject({
	preview: boolean().default(false).register(metas, {
		label: 'Preview key',
		editor: EditorType.Switch,
		description:
			'Preview keys can read saved drafts. Use a standard key for your live website.'
	}),
	name: string().register(metas, {
		label: 'Name',
		editor: EditorType.Input,
		description: 'Name the key'
	}),
	expires_at: date().optional().register(metas, {
		label: 'Expires',
		description:
			'You can limit the validity of the key by setting an expiration date.',
		editor: EditorType.Date
	})
})

export type NewApiKeySchema = TypeOf<typeof newApiKeySchema>

export const ApiKeyCreate = () => {
	const [createdKey, setCreatedKey] = useState<string>()
	const [formApi, ref] = useFormState()

	return (
		<Dialog open={$dialogOpen.value}>
			<DialogContent close={close}>
				<DialogHeader>
					<DialogTitle>Create new api key</DialogTitle>
					<DialogDescription>
						Allows to create a new api key for this project
					</DialogDescription>
				</DialogHeader>
				{createdKey ? (
					<div className="space-y-3">
						<p>Copy this key now. It will only be shown once.</p>
						<input
							aria-label="New API key"
							className="w-full"
							readOnly
							value={createdKey}
							onFocus={event => event.currentTarget.select()}
						/>
						<Button
							onClick={() => {
								setCreatedKey(undefined)
								close()
							}}
						>
							Done
						</Button>
					</div>
				) : (
					<ZodForm
						schema={newApiKeySchema}
						columns={2}
						onSubmit={async data => {
							const result = await createApiKey({
								...data,
								expires_at: data.expires_at?.toISOString()
							})
							setCreatedKey(result.key)
						}}
						ref={ref}
					>
						<DialogFooter className="gap-y-2">
							<Button type="button" onClick={close} variant="secondary">
								Cancel
							</Button>
							<Button type="submit" disabled={formApi.isSubmitting}>
								Create
							</Button>
						</DialogFooter>
					</ZodForm>
				)}
			</DialogContent>
		</Dialog>
	)
}
