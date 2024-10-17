import { preventDefault } from '@/lib/dom-events'
import { zodResolver } from '@hookform/resolvers/zod'
import {} from 'ramda'
import { useForm } from 'react-hook-form'
import type { ZodObject, ZodTypeAny } from 'zod'
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '../form'
import {} from '../select'
import { ZodFormField } from '../tree/types'
import { getEditor } from './editors'
import { generateDefaults } from './utils'

type OwnProps = {
	schema: ZodObject<any>
}

export const ZodForm = ({ schema }: OwnProps) => {
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: generateDefaults(schema)
	})
	return (
		<Form {...form}>
			<form className="flex flex-col gap-4" onSubmit={preventDefault}>
				{Object.entries<ZodTypeAny>(schema.shape).map(([name, schema]) => {
					const fieldData = ZodFormField.parse(
						JSON.parse(schema.description as string)
					)
					return (
						<FormField
							key={name}
							control={form.control}
							name={name}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{fieldData.label}</FormLabel>
									{getEditor(fieldData, schema, field)}
									{fieldData.description && (
										<FormDescription>{fieldData.description}</FormDescription>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
					)
				})}
			</form>
		</Form>
	)
}
