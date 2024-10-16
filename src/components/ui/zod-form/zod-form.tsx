import { pattern } from '@/lib/ramda'
import { T, equals as eq } from 'ramda'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { ZodDefault, type ZodObject, type ZodTypeAny } from 'zod'
import {
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

type OwnProps = {
	schema: ZodObject<any>
}

// biome-ignore format: keep pattern
const getEditor = pattern<[EditorType, any], ReactNode>([
	[eq<EditorType>(EditorType.select), T, (_, value) => <Select defaultValue={value} />],
	[eq<EditorType>(EditorType.input), T, (_, value) => <Input defaultValue={value} />]
])

const getDefaultValue = (zodRef: ZodTypeAny) =>
	zodRef instanceof ZodDefault ? zodRef._def.defaultValue() : undefined

export const ZodForm = ({ schema }: OwnProps) => {
	const form = useForm()
	return (
		<div className="">
			{Object.entries<ZodTypeAny>(schema.shape).map(([name, schema]) => {
				const fieldData = ZodFormField.parse(schema.description)
				return (
					<FormField
						key={name}
						control={form.control}
						name={name}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									{getEditor(fieldData.editor, getDefaultValue(schema))}
									<Input placeholder="shadcn" {...field} />
								</FormControl>
								<FormDescription>
									This is your public display name.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)
			})}
		</div>
	)
}
