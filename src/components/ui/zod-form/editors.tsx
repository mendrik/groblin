import { T as _ } from 'ramda'
import type { ReactNode } from 'react'
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
import { Input } from '../input'
import { EditorType, type ZodFormField } from '../tree/types'
import { innerType, isZodType } from './utils'

const isOfType =
	(type: EditorType) =>
	(obj: ZodFormField): boolean =>
		obj.editor === type

export const getEditor = match<
	[ZodFormField, ZodTypeAny, ControllerRenderProps],
	ReactNode
>(
	caseOf(
		[isOfType(EditorType.select), isZodType(ZodNativeEnum), _],
		(desc, type, field) => (
			<Select onValueChange={field.onChange} defaultValue={field.value}>
				<FormControl>
					<SelectTrigger>
						<SelectValue placeholder={desc.placeholder} />
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					{Object.entries(innerType(type).enum).map(([key, value]) => (
						<SelectItem key={key} value={`${value}`}>
							{value}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	),
	caseOf([isOfType(EditorType.input), _, _], (desc, _, field) => (
		<FormControl>
			<Input {...field} placeholder={desc.placeholder} />
		</FormControl>
	)),
	caseOf([_, _, _], (a, b, _) => (
		<div>
			Unsupported editor for "{`${a.label}`}":{' '}
			{`${a.editor}/${typeof b.constructor.name}`}
		</div>
	))
)
