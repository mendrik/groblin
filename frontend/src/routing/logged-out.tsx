import { ForgotPasswordDialog } from '@/components/app/authentication/forgot-password'
import { LoginDialog } from '@/components/app/authentication/login-dialog'
import { PasswordResetDialog } from '@/components/app/authentication/password-reset'
import { RegistrationDialog } from '@/components/app/authentication/register-dialog'
import { Form, FormControl } from '@/components/ui/form'
import { TagsInput } from '@/components/ui/tags-input'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Route } from 'wouter'

const Test = () => {
	const [tags, setTags] = useState<string[]>(['tag1', 'tag2', 'tag3'])
	const form = useForm({})
	return (
		<div className="p-8 max-w-sm m-auto">
			<Form {...form}>
				<FormControl>
					<TagsInput
						value={tags}
						onValueChange={setTags}
						placeholder="200x200"
					/>
				</FormControl>
			</Form>
		</div>
	)
}

export const LoggedOut = () => (
	<>
		<Route path="/tags" component={Test} />
		<Route path="/reset-password" component={PasswordResetDialog} />
		<Route path="/password" component={ForgotPasswordDialog} />
		<Route path="/register" component={RegistrationDialog} />
		<Route path="/" component={LoginDialog} />
	</>
)
