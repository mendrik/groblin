import { preventDefault } from '@/lib/dom-events'
import { pattern } from '@/lib/ramda'
import { zodResolver } from '@hookform/resolvers/zod'
import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
import { type ControllerRenderProps, useForm } from 'react-hook-form'
import type { ZodObject, ZodTypeAny } from 'zod'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '../form'
import { Input } from '../input'
import { Select } from '../select'
import { EditorType, ZodFormField } from '../tree/types'
import { generateDefaults } from './utils'

type OwnProps = {
	schema: ZodObject<any>
}

const isType = (type: EditorType) => (obj: ZodFormField) => obj.editor === type

// biome-ignore format: keep pattern
const getEditor = pattern<[ZodFormField, ControllerRenderProps], ReactNode>([
	[isType(EditorType.select), _, (desc, field) => <Select {...field}/>],
	[isType(EditorType.input), _, (desc, field) => <Input {...field} placeholder={desc.placeholder} />]
])

export const ZodForm = ({ schema }: OwnProps) => {
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: generateDefaults(schema)
	})
	return (
		<Form {...form}>
			<form className="" onSubmit={preventDefault}>
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
									<FormControl>{getEditor(fieldData, field)}</FormControl>
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
