import { caseOf, match } from '@/lib/match'
import { assertExists } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { equals as eq } from 'ramda'
import { type PropsWithChildren, useMemo } from 'react'
import {
	type DefaultValues,
	type Path,
	type UseFormReturn,
	useForm
} from 'react-hook-form'
import type { TypeOf, ZodObject, ZodRawShape } from 'zod'
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

type OwnProps<T extends ZodObject<any>> = {
	schema: T
	onSubmit: (data: TypeOf<T>) => void
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
		assertExists(zodSchema.description, `Missing description for field ${name}`)
		const fieldData = ZodFormField.parse(JSON.parse(zodSchema.description))
		yield {
			name,
			renderer: ({ field }: RendererProps<any>) => (
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

type FieldProps<T extends ZodRawShape> = {
	form: UseFormReturn<TypeOf<ZodObject<T>>>
	schema: ZodObject<T>
}

export const Fields = <T extends ZodRawShape>({
	form,
	schema
}: FieldProps<T>) =>
	[...schemaIterator(schema)].map(({ name, renderer }) => (
		<FormField
			key={name}
			control={form.control}
			name={name as Path<TypeOf<ZodObject<T>>>}
			render={renderer}
		/>
	))

export const ZodForm = <T extends ZodObject<any>>({
	schema,
	columns = 1,
	onSubmit,
	children
}: PropsWithChildren<OwnProps<T>>) => {
	const defaultValues = useMemo(
		() => generateDefaults(schema) as DefaultValues<TypeOf<T>>,
		[schema]
	)

	const form = useForm<TypeOf<T>>({
		resolver: zodResolver(schema),
		defaultValues
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
			>
				<div className={`grid ${cols(columns)} gap-4`}>
					<Fields form={form} schema={schema} />
				</div>
				{children}
			</form>
		</Form>
	)
}
