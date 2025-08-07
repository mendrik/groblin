import { zodResolver } from "@hookform/resolvers/zod";
import { caseOf, match } from "matchblade";
import { equals as eq } from "ramda";
import {
	type ForwardedRef,
	type PropsWithChildren,
	forwardRef,
	useImperativeHandle,
	useMemo,
} from "react";
import {
	type DefaultValues,
	FieldPath,
	type FieldValues,
	type UseFormReturn,
	useForm,
} from "react-hook-form";
import type { input, output, ZodObject, ZodRawShape } from "zod/v4";
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../form";
import { Editor } from "./editors";
import { generateDefaults } from "./utils";

import { assertExists } from "@shared/asserts";
import { $InferObjectInput, $InferObjectOutput, $ZodObject } from "zod/v4/core";
import { FieldMeta } from "./types";
import "./zod-form.css";

const cols = match<[number], string>(
	caseOf([eq(1)], "grid-cols-1 sm:grid-cols-1"),
	caseOf([eq(2)], "grid-cols-1 sm:grid-cols-2"),
	caseOf([eq(3)], "grid-cols-1 sm:grid-cols-3"),
);

const colSpan = match<[number], string>(
	caseOf([eq(1)], "sm:col-span-1"),
	caseOf([eq(2)], "sm:col-span-2"),
	caseOf([eq(3)], "sm:col-span-3"),
);

function* schemaIterator<T extends ZodRawShape>(schema: $ZodObject<T>) {
	const def = schema._zod.def;
	for (const [name, type] of Object.entries(schema._zod.def.shape.fields)) {
		const fieldData = type.meta() as FieldMeta;
		assertExists(fieldData, `Field meta data is missing in ${name}`);
		yield {
			name,
			renderer: ({ field }) => (
				<FormItem className={colSpan(fieldData.span ?? 1)}>
					<FormLabel>{fieldData.label}</FormLabel>
					<Editor desc={fieldData} type={type} field={field} />
					<FormDescription>{fieldData.description}</FormDescription>
					<FormMessage />
				</FormItem>
			),
		};
	}
}

type FieldProps<T extends Record<string, any>> = {
	form: UseFormReturn<input<any>, any, output<any>>;
	schema: ZodObject<T>;
};

export const Fields = <T extends ZodRawShape>({
	form,
	schema,
}: FieldProps<T>) =>
	[...schemaIterator(schema)].map(({ name, renderer }) => (
		<FormField
			key={name}
			control={form.control}
			name={name as FieldPath<T>}
			render={renderer}
		/>
	));

export type FormApi<F extends FieldValues> = {
	formState: UseFormReturn<F>["formState"];
};

type OwnProps<T extends ZodRawShape> = {
	schema: ZodObject<T>;
	onSubmit: (data: any) => void;
	onError?: (err: Error) => void;
	columns?: number;
	disabled?: boolean;
	defaultValues?: DefaultValues<T>;
};

export const ZodForm = forwardRef(
	<T extends ZodRawShape>(
		{
			schema,
			columns = 1,
			onSubmit,
			disabled = false,
			onError = console.error,
			defaultValues: externalDefaults,
			children,
		}: PropsWithChildren<OwnProps<T>>,
		ref: ForwardedRef<FormApi<T>>,
	) => {
		const defaultValues = useMemo(
			() => externalDefaults ?? (generateDefaults(schema)),
			[schema, externalDefaults],
		);

		const form = useForm<input<typeof schema>, any, output<typeof schema>>({
			resolver: zodResolver(schema),
			defaultValues,
		});

		useImperativeHandle(ref, () => ({
			formState: form.formState as any,
		}));

		return (
			<Form {...form}>
				<form
					onSubmit={(e) =>
						form
							.handleSubmit(
								onSubmit,
								console.error,
							)(e)
							.catch((e) => {
								console.error(e);
								onError(e);
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
		);
	},
);
