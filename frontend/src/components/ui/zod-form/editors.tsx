import { T as _, apply, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { FormControl } from '../form'

import { caseOf, match } from '@/lib/match'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { ZodNumber, type ZodTypeAny } from 'zod'
import { Input } from '../input'
import {} from '../select'
import { SimpleSelect } from '../simple/select'
import { Switch } from '../switch'
import type { FieldMeta, FieldSelectMeta } from './types'
import { isZodType } from './utils'

const isOfType =
	(type: EditorType) =>
	(obj: FieldMeta): boolean =>
		obj.editor === type

const hasOptions = (obj: FieldMeta): obj is FieldSelectMeta =>
	'options' in obj && obj.options !== undefined

type OwnProps = {
	desc: FieldMeta
	type: ZodTypeAny
	field: ControllerRenderProps
}

type Args = readonly [FieldMeta, ZodTypeAny, ControllerRenderProps]

const matcher = match<Args, ReactNode>(
	caseOf(
		[hasOptions, isZodType(ZodNumber), _],
		(desc, type, { onChange, value, ...field }) => {
			return (
				<SimpleSelect<number>
					options={desc.options}
					defaultValue={value}
					onChange={onChange}
					optional={type.isOptional()}
					placeholder={desc.placeholder}
				/>
			)
		}
	),
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
