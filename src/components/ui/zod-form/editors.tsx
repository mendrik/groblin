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
import { isZodType } from './utils'

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
		(desc, _, field) => (
			<Select onValueChange={field.onChange} defaultValue={field.value}>
				<FormControl>
					<SelectTrigger>
						<SelectValue placeholder={desc.placeholder} />
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					<SelectItem value="m@example.com">m@example.com</SelectItem>
					<SelectItem value="m@google.com">m@google.com</SelectItem>
					<SelectItem value="m@support.com">m@support.com</SelectItem>
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
