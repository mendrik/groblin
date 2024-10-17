import { caseOf, match } from '@/lib/match'
import { zodResolver } from '@hookform/resolvers/zod'
import { equals as eq } from 'ramda'
import type { PropsWithChildren } from 'react'
import { type DefaultValues, useForm } from 'react-hook-form'
import type { ZodObject, ZodRawShape } from 'zod'
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
import { Editor } from './editors'
import { type RendererProps, generateDefaults } from './utils'

type OwnProps<T extends ZodRawShape> = {
	schema: ZodObject<T>
	onSubmit: (data: T) => void
	columns?: number
}

const cols = match<[number], string>(
	caseOf([eq(1)], () => 'grid-cols-1 sm:grid-cols-1'),
	caseOf([eq(2)], () => 'grid-cols-1 sm:grid-cols-2'),
	caseOf([eq(3)], () => 'grid-cols-1 sm:grid-cols-3')
)

const colSpan = match<[number], string>(
	caseOf([eq(1)], () => 'sm:col-span-1'),
	caseOf([eq(2)], () => 'sm:col-span-2'),
	caseOf([eq(3)], () => 'sm:col-span-3')
)

function* schemaIterator<T extends ZodRawShape>(schema: ZodObject<T>) {
	for (const [name, zodSchema] of Object.entries(schema.shape)) {
		const fieldData = ZodFormField.parse(
			JSON.parse(zodSchema.description as string)
		)
		yield {
			name,
			renderer: ({ field }: RendererProps) => (
				<FormItem className={colSpan(fieldData.span ?? 1)}>
					<FormLabel>{fieldData.label}</FormLabel>
					<Editor desc={fieldData} type={zodSchema} field={field} />
					{fieldData.description && (
						<FormDescription>{fieldData.description}</FormDescription>
					)}
					<FormMessage />
				</FormItem>
			)
		}
	}
}

export const ZodForm = <T extends ZodRawShape>({
	schema,
	columns = 1,
	onSubmit,
	children
}: PropsWithChildren<OwnProps<T>>) => {
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: generateDefaults(schema) as DefaultValues<any>
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
			>
				<div className={`grid ${cols(columns)} gap-4`}>
					{[...schemaIterator(schema)].map(({ name, renderer }) => (
						<FormField
							key={name}
							control={form.control}
							name={name}
							render={renderer}
						/>
					))}
				</div>
				{children}
			</form>
		</Form>
	)
}
