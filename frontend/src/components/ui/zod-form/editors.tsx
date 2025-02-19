import { safeFormat } from '@/lib/date'
import { inputValue } from '@/lib/dom-events'
import { EditorType } from '@shared/enums'
import { caseOf, match } from '@shared/utils/match'
import type { AnyFn } from '@tp/functions'
import { Calendar } from 'lucide-react'
import { path, T as _, nth, pipe } from 'ramda'
import type { ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { ZodNativeEnum, ZodNumber, type ZodTypeAny } from 'zod'
import { openDatePicker } from '../date-picker/date-picker-dialog'
import { FormControl } from '../form'
import { Input } from '../input'
import { MaskedInput } from '../random/masked-input'
import { MicroIcon } from '../random/micro-icon'
import { SimpleSelect } from '../simple/select'
import { Switch } from '../switch'
import { TagsInput } from '../tags-input'
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
					onChange={pipe(nth(1) as AnyFn, onChange)}
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
				<MaskedInput
					{...field}
					onChange={pipe(inputValue, Number, onChange)}
					mask={Number}
					className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-0 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					defaultValue={value}
					placeholder={desc.placeholder}
					autoComplete={desc.autofill}
					{...desc.extra}
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
		(desc, _, { value, onChange, ...field }) => (
			<FormControl className="block">
				<Switch {...field} onCheckedChange={onChange} defaultChecked={value} />
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.File }, _, _],
		(desc, _, { value, onChange, ...field }) => (
			<FormControl>
				<Input
					{...field}
					{...desc.extra}
					onChange={pipe(path(['target', 'files', 0]), onChange)}
					className="p-2"
					type="file"
					placeholder={desc.placeholder}
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Tags }, _, _],
		(desc, _, { onChange, ...field }) => (
			<FormControl>
				<TagsInput
					{...field}
					onValueChange={onChange}
					placeholder={desc.placeholder}
				/>
			</FormControl>
		)
	),
	caseOf(
		[{ editor: EditorType.Date }, _, _],
		(_desc, _, { onChange, value }) => (
			<FormControl>
				<div className="flex h-9 items-center justify-between gap-1 text-sm">
					<span>{value ? safeFormat(value, 'dd.MM.yyyy') : 'never'}</span>
					<MicroIcon
						icon={Calendar}
						onClick={() =>
							openDatePicker({
								date: value,
								callback: onChange
							})
						}
					/>
				</div>
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

export const Editor = ({ desc, field, type }: OwnProps) =>
	matcher(desc, type, field)
