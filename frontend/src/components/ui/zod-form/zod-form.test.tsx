import { inputText } from '@/test.setup'
import { EditorType } from '@shared/enums'
import { render, screen, waitFor } from '@testing-library/react'
import { delayP } from 'ramda-adjunct'
import { describe, expect, test, vi } from 'vitest'
import { boolean, object, string } from 'zod'
import { Button } from '../button'
import { asField } from './utils'
import { ZodForm } from './zod-form'

describe('ZodForm', () => {
	test('string schema works', async () => {
		const schemaString = object({
			formTestField: asField(string().optional(), {
				label: 'Test',
				editor: EditorType.Input
			})
		})
		const submit = vi.fn()

		render(
			<ZodForm schema={schemaString} onSubmit={submit}>
				<Button type="submit">Test</Button>
			</ZodForm>
		)
		expect(screen.getByLabelText('Test')).toBeDefined()
		inputText('foo')(screen.getByRole('textbox'))
		screen.getByRole('button').click()
		await waitFor(() =>
			expect(submit).toHaveBeenCalledWith(
				{ formTestField: 'foo' },
				expect.anything()
			)
		)
	})

	test('string schema works with default', async () => {
		const schemaString = object({
			formTestField: asField(string().default('foop'), {
				label: 'Test',
				editor: EditorType.Input
			})
		})
		const submit = vi.fn()

		render(
			<ZodForm schema={schemaString} onSubmit={submit}>
				<Button type="submit">Test</Button>
			</ZodForm>
		)
		screen.getByRole('button').click()
		await waitFor(() =>
			expect(submit).toHaveBeenCalledWith(
				{ formTestField: 'foop' },
				expect.anything()
			)
		)
	})

	test('boolean schema works with default', async () => {
		const schemaString = object({
			formTestField: asField(boolean().default(false), {
				label: 'Test',
				editor: EditorType.Switch
			})
		})
		const submit = vi.fn()

		render(
			<ZodForm schema={schemaString} onSubmit={submit}>
				<Button type="submit">Test</Button>
			</ZodForm>
		)
		screen.getByRole('switch').click()
		await delayP(1)
		screen.getByRole('button').click()

		await waitFor(() =>
			expect(submit).toHaveBeenCalledWith(
				{ formTestField: true },
				expect.anything()
			)
		)
	})
})
