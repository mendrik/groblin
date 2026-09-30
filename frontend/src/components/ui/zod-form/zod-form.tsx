import { zodResolver } from '@hookform/resolvers/zod'
import { assertExists } from '@shared/asserts'
import { caseOf, match } from 'matchblade'
import { equals as eq } from 'ramda'
import {
	type ForwardedRef,
	forwardRef,
	type PropsWithChildren,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState
} from 'react'
import {
	type ControllerRenderProps,
	type DefaultValues,
	type FieldPath,
	type UseFormReturn,
	useForm
} from 'react-hook-form'
import type { input, output, ZodObject, ZodRawShape, ZodType } from 'zod/v4'
import type { $ZodObject } from 'zod/v4/core'
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '../form'
import { Editor } from './editors'
import type { FieldMeta } from './types'
import { generateDefaults, metas } from './utils'
import './zod-form.css'

const cols = match<[number], string>(
	caseOf([eq(1)], 'grid-cols-1 sm:grid-cols-1'),
	caseOf([eq(2)], 'grid-cols-1 sm:grid-cols-2'),
	caseOf([eq(3)], 'grid-cols-1 sm:grid-cols-3')
)

const colSpan = match<[number], string>(
	caseOf([eq(1)], 'sm:col-span-1'),
	caseOf([eq(2)], 'sm:col-span-2'),
	caseOf([eq(3)], 'sm:col-span-3')
)

function* schemaIterator<T extends ZodRawShape>(schema: $ZodObject<T>) {
	const def = schema._zod.def

	for (const [name, type] of Object.entries(def.shape)) {
		const fieldData = metas.get(type) as FieldMeta
		assertExists(fieldData, `Field meta data is missing in ${name}`)
		yield {
			name,
			renderer: ({ field }: { field: ControllerRenderProps }) => (
				<FormItem className={colSpan(fieldData.span ?? 1)}>
					<FormLabel>{fieldData.label}</FormLabel>
					<Editor desc={fieldData} type={type as ZodType} field={field} />
					<FormDescription>{fieldData.description}</FormDescription>
					<FormMessage />
				</FormItem>
			)
		}
	}
}

type FieldProps<T extends Record<string, any>> = {
	form: UseFormReturn<input<any>, any, output<any>>
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
			name={name as FieldPath<T>}
			render={renderer}
		/>
	))

export type FormApi = { formState: { isSubmitting: boolean } }

type OwnProps<T extends ZodRawShape> = {
	schema: ZodObject<T>
	onSubmit: (data: any) => void
	onValueChange?: (data: unknown) => void
	onError?: (err: Error) => void
	columns?: number
	disabled?: boolean
	defaultValues?: DefaultValues<input<ZodObject<T>>>
}

export const ZodForm = forwardRef(
	<T extends ZodRawShape>(
		{
			schema,
			columns = 1,
			onSubmit,
			onValueChange,
			disabled = false,
			onError = console.error,
			defaultValues: externalDefaults,
			children
		}: PropsWithChildren<OwnProps<T>>,
		ref: ForwardedRef<FormApi>
	) => {
		const defaultValues = useMemo(
			() => externalDefaults ?? generateDefaults(schema),
			[schema, externalDefaults]
		)

		const form = useForm<input<typeof schema>, any, output<typeof schema>>({
			resolver: zodResolver(schema),
			defaultValues
		})
		const [submitError, setSubmitError] = useState<string>()
		useEffect(() => {
			if (!onValueChange) return
			const watch = form.watch(values =>
				onValueChange(JSON.parse(JSON.stringify(values)))
			)
			return () => watch.unsubscribe()
		}, [form, onValueChange])

		useImperativeHandle(
			ref,
			() => ({
				formState: { isSubmitting: form.formState.isSubmitting }
			}),
			[form.formState.isSubmitting]
		)

		return (
			<Form {...form}>
				<form
					onSubmit={e => {
						setSubmitError(undefined)
						form
							.handleSubmit(
								onSubmit,
								console.error
							)(e)
							.catch(e => {
								setSubmitError(
									e instanceof Error
										? e.message
										: 'Save failed. Your changes have been kept.'
								)
								console.error(e)
								onError(e)
							})
					}}
					className="flex flex-col gap-6 relative"
					data-disabled={disabled ? true : undefined}
				>
					<div className={`grid ${cols(columns)} gap-4`}>
						<Fields form={form} schema={schema} />
					</div>
					{children}
					{submitError && (
						<p role="alert" className="text-sm text-destructive">
							{submitError}
						</p>
					)}
				</form>
			</Form>
		)
	}
)
