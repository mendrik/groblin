import { pattern } from '@/lib/ramda'
import { T as _, is } from 'ramda'
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

import { caseOf } from '@/lib/pattern'
import { Input } from '../input'
import { EditorType, type ZodFormField } from '../tree/types'

const isType =
	(type: EditorType) =>
	(obj: ZodFormField): boolean =>
		obj.editor === type

export const getEditor = pattern<
	[ZodFormField, ZodTypeAny, ControllerRenderProps],
	ReactNode
>([
	caseOf(isType(EditorType.select), is(ZodNativeEnum), _, (desc, e, field) => (
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
	)),
	caseOf(isType(EditorType.input), _, _, (desc, _, field) => (
		<FormControl>
			<Input {...field} placeholder={desc.placeholder} />
		</FormControl>
	))
])
