import { T as _, apply, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { ZodNativeEnum, type ZodTypeAny } from 'zod'
import { FormControl } from '../form'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../select'

import { caseOf, match } from '@/lib/match'
import type { Fn } from '@/type-patches/functions'
import { Input } from '../input'
import { EditorType, type ZodFormField } from '../tree/types'
import { innerType, isZodType } from './utils'

const isOfType =
	(type: EditorType) =>
	(obj: ZodFormField): boolean =>
		obj.editor === type

type OwnProps = {
	desc: ZodFormField
	type: ZodTypeAny
	field: ControllerRenderProps
}

type Args = readonly [ZodFormField, ZodTypeAny, ControllerRenderProps]

const matcher = match<Args, ReactNode>(
	caseOf(
		[isOfType(EditorType.select), isZodType(ZodNativeEnum), _],
		(desc, type, field) => {
			const enumValue: Record<string, any> = innerType(type).enum
			return (
				<Select>
					<FormControl>
						<SelectTrigger {...field}>
							<SelectValue placeholder={desc.placeholder} />
						</SelectTrigger>
					</FormControl>
					<SelectContent>
						{Object.entries(enumValue).map(([key, value]) => (
							<SelectItem key={key} value={enumValue[key]}>
								{value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)
		}
	),
	caseOf([isOfType(EditorType.input), _, _], (desc, _, field) => (
		<FormControl>
			<Input
				{...field}
				placeholder={desc.placeholder}
				autoComplete={desc.autofill}
			/>
		</FormControl>
	)),
	caseOf([_, _, _], (a, b, _) => (
		<div>
			Unsupported editor for "{`${a.label}`}":{' '}
			{`${a.editor}/${typeof b.constructor.name}`}
		</div>
	))
)

const propsToArgs = ({ desc, type, field }: OwnProps) =>
	[desc, type, field] as Args

export const Editor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
