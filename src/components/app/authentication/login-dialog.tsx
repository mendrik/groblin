import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { EditorType } from '@/components/ui/tree/types'
import { asField } from '@/components/ui/zod-form/utils'
import { ZodForm } from '@/components/ui/zod-form/zod-form'
import { stopPropagation } from '@/lib/dom-events'
import {} from '@/lib/match'
import { pipeAsync } from '@/lib/pipe-async'
import { setSignal } from '@/lib/utils'
import type { Fn } from '@/type-patches/functions'
import { signal } from '@preact/signals-react'
import { F, pipe } from 'ramda'
import { type TypeOf, strictObject, string } from 'zod'

export const $loginDialogOpen = signal(false)
export const openNodeCreate = setSignal($loginDialogOpen, true)
const close = pipe(F, setSignal($loginDialogOpen))

const loginSchema = strictObject({
	email: string()
		.describe(
			asField({
				label: 'Email',
				editor: EditorType.email
			})
		)
		.default('New node'),
	password: string().describe(
		asField({
			label: 'Type',
			editor: EditorType.password
		})
	)
})

type Login = TypeOf<typeof loginSchema>

const loginCommand: Fn<Login, void> = pipeAsync(console.log)

export const LoginDialog = () => {
	return (
		<Dialog open={$loginDialogOpen.value}>
			<DialogContent
				onEscapeKeyDown={close}
				onKeyDown={stopPropagation}
				onInteractOutside={close}
			>
				<DialogHeader>
					<DialogTitle>Login</DialogTitle>
					<DialogDescription>
						Please enter your email and password
					</DialogDescription>
				</DialogHeader>
				<ZodForm schema={loginSchema} onSubmit={pipe(loginCommand, close)}>
					<DialogFooter className="gap-y-2">
						<Button onClick={close} variant="secondary">
							Cancel
						</Button>
						<Button type="submit">Create</Button>
					</DialogFooter>
				</ZodForm>
			</DialogContent>
		</Dialog>
	)
}
