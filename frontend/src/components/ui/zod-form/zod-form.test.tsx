import { EditorType } from '@shared/enums'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { delayP } from 'ramda-adjunct'
import { describe, expect, test, vi } from 'vitest'
import { boolean, object, string, enum as zodEnum } from 'zod/v4'
import { inputText } from '@/test.setup'
import { Button } from '../button'
import { metas } from './utils'
import { ZodForm } from './zod-form'

describe('ZodForm', () => {
	test('nullable enum selectors can be cleared and submit null', async () => {
		const schema = object({
			type: zodEnum(['String', 'Object'])
				.nullable()
				.register(metas, {
					label: 'Type',
					editor: EditorType.Select,
					options: [
						['String', 'String'],
						['Object', 'Object']
					]
				})
		})
		const submit = vi.fn()
		render(
			<ZodForm
				schema={schema}
				defaultValues={{ type: 'String' }}
				onSubmit={submit}
			>
				<Button type="submit">Submit</Button>
			</ZodForm>
		)
		fireEvent.keyDown(screen.getByRole('combobox', { name: 'Type' }), {
			key: 'ArrowDown'
		})
		fireEvent.click(await screen.findByRole('option', { name: 'None' }))
		screen.getByRole('button', { name: 'Submit' }).click()
		await waitFor(() =>
			expect(submit).toHaveBeenCalledWith({ type: null }, expect.anything())
		)
	})
	test('defaulted enum fields render an accessible selector and preserve the default on submission', async () => {
		const schema = object({
			type: zodEnum(['String', 'Object'])
				.default('Object')
				.register(metas, {
					label: 'Type',
					editor: EditorType.Select,
					options: [
						['String', 'String'],
						['Object', 'Object']
					]
				})
		})
		const submit = vi.fn()
		render(
			<ZodForm schema={schema} onSubmit={submit}>
				<Button type="submit">Submit</Button>
			</ZodForm>
		)
		expect(
			screen.getByRole('combobox', { name: 'Type' }).textContent
		).toContain('Object')
		screen.getByRole('button', { name: 'Submit' }).click()
		await waitFor(() =>
			expect(submit).toHaveBeenCalledWith({ type: 'Object' }, expect.anything())
		)
	})
	test('string schema works', async () => {
		const schemaString = object({
			formTestField: string().optional().register(metas, {
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
			formTestField: string().default('foop').register(metas, {
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
			formTestField: boolean().default(false).register(metas, {
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
