import { Api } from "@/gql-client";
import { EditorType } from "@shared/enums";
import { _, caseOf, match } from "matchblade";
import { any, anyPass, isNotEmpty, pipe, trim } from "ramda";
import {
	ZodArray,
	ZodCatch,
	ZodDefault,
	ZodLazy,
	ZodNonOptional,
	ZodNullable,
	ZodObject,
	ZodOptional,
	ZodPrefault,
	ZodPromise,
	ZodReadonly,
	type ZodType,
	registry,
	string,
} from "zod/v4";
import { $strip } from "zod/v4/core";
import type { FieldMeta } from "./types";

export const metas = registry<FieldMeta>();
const z = {} as any;

const isZodObject = (value: ZodType): value is ZodObject<any> =>
	value instanceof ZodObject;
const isZodArray = (value: ZodType): value is ZodArray<any> =>
	value instanceof ZodArray;
const isZodDefault = (value: ZodType): value is ZodDefault<any> =>
	value instanceof ZodDefault;
const isZodOptional = (value: ZodType): value is ZodOptional<any> =>
	value instanceof ZodOptional;
const isZodPrefault = (value: ZodType): value is ZodPrefault<any> =>
	value instanceof ZodPrefault;
const isZodNonOptional = (value: ZodType): value is ZodNonOptional<any> =>
	value instanceof ZodNonOptional;
const isZodNullable = (value: ZodType): value is ZodNullable<any> =>
	value instanceof ZodNullable;
const isZodCatch = (value: ZodType): value is ZodCatch<any> =>
	value instanceof ZodCatch;
const isZodReadonly = (value: ZodType): value is ZodReadonly<any> =>
	value instanceof ZodReadonly;
const isZodLazy = (value: ZodType): value is ZodLazy<any> =>
	value instanceof ZodLazy;
const isZodPromise = (value: ZodType): value is ZodPromise<any> =>
	value instanceof ZodPromise;

const isWrappedType = anyPass([
	isZodDefault,
	isZodOptional,
	isZodPrefault,
	isZodNonOptional,
	isZodNullable,
	isZodCatch,
	isZodReadonly,
	isZodLazy,
	isZodPromise,
]);

export const stringField = (
	label: string,
	editor: EditorType,
	autofill?: string,
	placeholder?: string,
) =>
	string()
		.refine(pipe(trim, isNotEmpty), { message: `${label} is required` })
		.default("")
		.register(metas, { label, editor, autofill, placeholder });

export const generateDefaults = match<[ZodType], any>(
	caseOf([isZodDefault], (type) => type.def.defaultValue),
	caseOf([isZodObject], (type) =>
		Object.entries(type.def.shape).reduce(
			(acc, [key, value]) => ({ ...acc, [key]: generateDefaults(value) }),
			{},
		),
	),
	caseOf([isWrappedType], (type) => generateDefaults(type.unwrap())),
	caseOf([_], undefined),
);

export const enumToMap = <T extends Record<string, string>>(enumRef: T) =>
	Object.entries(enumRef);

export const uploadToS3 = async (file: File) => {
	const { signedUrl, object } = await Api.UploadUrl({ filename: file.name });
	const response = await fetch(signedUrl, {
		method: "PUT",
		headers: {
			"Content-Type": file.type,
		},
		body: file,
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return object;
};

export const fileUpload = (
	label: string,
	accept: string,
	description: string,
) =>
	z
		.instanceof(File)
		.transform(
			async (file, ctx) =>
				await uploadToS3(file).catch((err: Error) => {
					ctx.addIssue({
						code: "invalid_type",
						message: err.message,
					});
					return z.NEVER;
				}),
		)
		.register(metas, {
			label,
			editor: EditorType.File,
			extra: accept,
			description,
		});
