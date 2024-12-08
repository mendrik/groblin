import { zodResolver } from '@hookform/resolvers/zod'
import { caseOf, match } from '@shared/utils/match'
import { equals as eq } from 'ramda'
import {
	type ForwardedRef,
	type PropsWithChildren,
	forwardRef,
	useImperativeHandle,
	useMemo
} from 'react'
import {
	type DefaultValues,
	type FieldValues,
	type Path,
	type UseFormReturn,
	useForm
} from 'react-hook-form'
import type {
	TypeOf,
	ZodDefault,
	ZodEffects,
	ZodObject,
	ZodRawShape
} from 'zod'
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '../form'
import { Editor } from './editors'
import {
	type RendererProps,
	generateDefaults,
	innerType,
	isEnhanced
} from './utils'

import './zod-form.css'
import { assertExists } from '@shared/asserts'

type AllowedTypes<T extends ZodRawShape> =
	| ZodObject<T>
	| ZodEffects<ZodObject<T>>
	| ZodDefault<ZodObject<T>>

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

function* schemaIterator<T extends ZodRawShape>(schema: AllowedTypes<T>) {
	for (const [name, zodSchema] of Object.entries(innerType(schema).shape)) {
		const fieldData = isEnhanced(zodSchema) ? zodSchema.meta : undefined
		assertExists(fieldData, `Field meta data is missing in ${name}`)
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
	form: UseFormReturn<TypeOf<AllowedTypes<T>>>
	schema: AllowedTypes<T>
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

export type FormApi<F extends FieldValues> = {
	formState: UseFormReturn<F>['formState']
}

type OwnProps<T extends AllowedTypes<any>> = {
	schema: T
	onSubmit: (data: any) => void
	onError?: (err: Error) => void
	columns?: number
	disabled?: boolean
	defaultValues?: DefaultValues<TypeOf<T>>
}

export const ZodForm = forwardRef(
	<T extends AllowedTypes<any>>(
		{
			schema,
			columns = 1,
			onSubmit,
			disabled = false,
			onError = console.error,
			defaultValues: externalDefaults,
			children
		}: PropsWithChildren<OwnProps<T>>,
		ref: ForwardedRef<FormApi<TypeOf<T>>>
	) => {
		const defaultValues = useMemo(
			() =>
				externalDefaults ??
				(generateDefaults(innerType(schema)) as DefaultValues<TypeOf<T>>),
			[schema, externalDefaults]
		)

		const form = useForm<TypeOf<T>>({
			resolver: zodResolver(schema),
			defaultValues
		})

		useImperativeHandle(ref, () => ({
			formState: form.formState
		}))

		return (
			<Form {...form}>
				<form
					onSubmit={e =>
						form
							.handleSubmit(
								onSubmit,
								console.error
							)(e)
							.catch(e => {
								console.error(e)
								onError(e)
							})
					}
					className="flex flex-col gap-6 relative"
					data-disabled={disabled ? true : undefined}
				>
					<div className={`grid ${cols(columns)} gap-4`}>
						<Fields form={form} schema={schema} />
					</div>
					{children}
				</form>
			</Form>
		)
	}
)
