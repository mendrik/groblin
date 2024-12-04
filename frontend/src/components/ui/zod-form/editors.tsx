import { inputValue } from '@/lib/dom-events'
import { caseOf, match } from '@/lib/match'
import { EditorType } from '@shared/enums'
import type { Fn } from '@tp/functions.ts'
import { T as _, apply, nth, pipe } from 'ramda'
import type { FC, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { ZodNativeEnum, ZodNumber, type ZodTypeAny } from 'zod'
import { FormControl } from '../form'
import { Input } from '../input'
import {} from '../select'
import { SimpleSelect } from '../simple/select'
import { Switch } from '../switch'
import type { FieldMeta, FieldSelectMeta } from './types'
import { innerType, isZodType } from './utils'

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
		[hasOptions, isZodType(ZodNativeEnum), _],
		(desc, type, { onChange, value, ref, ...field }) => {
			return (
				<SimpleSelect<[string, string]>
					options={desc.options}
					render={nth(0)}
					value={desc.options.find(([_, v]) => v === value)}
					optional={type.isNullable()}
					onChange={t => onChange(t?.[1] ?? null)}
					placeholder={desc.placeholder}
					{...field}
				/>
			)
		}
	),
	caseOf(
		[hasOptions, isZodType(ZodNumber), _],
		(desc, type, { onChange, value, ref, ...field }) => {
			return (
				<SimpleSelect<{ id: number; name: string }>
					options={desc.options}
					render={t => t.name}
					value={desc.options.find(t => t.id === value)}
					optional={type.isNullable()}
					onChange={t => onChange(t?.id ?? null)}
					placeholder={desc.placeholder}
					{...field}
				/>
			)
		}
	),
	caseOf(
		[{ editor: EditorType.Input }, _, _],
		(desc, _, { value, ...field }) => (
			<FormControl>
				<Input
					{...field}
					defaultValue={value}
					placeholder={desc.placeholder}
					autoComplete={desc.autofill}
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Number }, _, _],
		(desc, _, { value, onChange, ...field }) => (
			<FormControl>
				<Input
					{...field}
					onChange={pipe(inputValue, Number, onChange)}
					defaultValue={value}
					placeholder={desc.placeholder}
					autoComplete={desc.autofill}
					type="number"
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Email }, _, _],
		(desc, _, { value, ...field }) => (
			<FormControl>
				<Input
					{...field}
					type="email"
					defaultValue={value}
					placeholder={desc.placeholder}
					autoComplete={desc.autofill}
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Password }, _, _],
		(desc, _, { value, ...field }) => (
			<FormControl>
				<Input
					{...field}
					type="password"
					placeholder={desc.placeholder}
					autoComplete={desc.autofill}
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Switch }, _, _],
		(desc, _, { value, ...field }) => (
			<FormControl className="block">
				<Switch
					{...field}
					onCheckedChange={field.onChange}
					defaultChecked={value}
				/>
			</FormControl>
		)
	),
	caseOf([_, _, _], (a, b: any, _) => {
		return (
			<div>
				Unsupported editor for "{`${a.label}`}":{' '}
				{`${a.editor}/${innerType(b)._def.typeName}`}
			</div>
		)
	})
)

const propsToArgs = ({ desc, type, field }: OwnProps) =>
	[desc, type, field] as Args

export const Editor: FC<OwnProps> = pipe(
	propsToArgs as Fn<OwnProps, [...Args]>,
	apply(matcher)
)
