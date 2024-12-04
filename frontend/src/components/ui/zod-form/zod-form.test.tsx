import { EditorType } from '@shared/enums'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { object, string } from 'zod'
import { asField } from './utils'
import { ZodForm } from './zod-form'

describe('ZodForm', () => {
	it('string schema works', () => {
		const schemaString = object({
			test: asField(string().optional(), {
				label: 'Test',
				editor: EditorType.Input,
				span: 2
			})
		})
		const submit = vi.fn()
		const onError = vi.fn()
		render(
			<ZodForm
				schema={schemaString}
				columns={2}
				onSubmit={submit}
				onError={onError}
			/>
		)
		expect(screen.getByLabelText('Test')).toBeDefined()
	})
})
