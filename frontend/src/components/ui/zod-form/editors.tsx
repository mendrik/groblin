import { T as _, apply, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { FormControl } from '../form'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../select'

import { caseOf, match } from '@/lib/match'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { toNumber } from 'ramda-adjunct'
import { ZodNumber, ZodOptional, type ZodTypeAny } from 'zod'
import { Input } from '../input'
import { Switch } from '../switch'
import type { ZodFormField } from '../tree/types'
import { isSelectField, isZodType } from './utils'

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
	caseOf([isSelectField, _, _], (desc, type, { onChange, value, ...field }) => {
		const onValueChange = isZodType(ZodNumber)(type)
			? pipe(toNumber, onChange)
			: onChange
		const isOptional = isZodType(ZodOptional)(type)
		return (
			<Select
				onValueChange={onValueChange}
				defaultValue={value}
				required={!isOptional}
			>
				<FormControl>
					<SelectTrigger {...field}>
						<SelectValue placeholder={desc.placeholder} />
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					{Object.entries(desc.options).map(([key, value]) => (
						<SelectItem key={key} value={value}>
							{key}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}),
	caseOf([isOfType(EditorType.Input), _, _], (desc, _, field) => (
		<FormControl>
			<Input
				{...field}
				placeholder={desc.placeholder}
				autoComplete={desc.autofill}
			/>
		</FormControl>
	)),
	caseOf([isOfType(EditorType.Email), _, _], (desc, _, field) => (
		<FormControl>
			<Input
				{...field}
				type="email"
				placeholder={desc.placeholder}
				autoComplete={desc.autofill}
			/>
		</FormControl>
	)),
	caseOf([isOfType(EditorType.Password), _, _], (desc, _, field) => (
		<FormControl>
			<Input
				{...field}
				type="password"
				placeholder={desc.placeholder}
				autoComplete={desc.autofill}
			/>
		</FormControl>
	)),
	caseOf([isOfType(EditorType.Switch), _, _], (_desc, _, field) => (
		<FormControl className="block">
			<Switch {...field} onCheckedChange={field.onChange} />
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
