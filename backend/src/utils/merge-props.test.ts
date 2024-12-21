import { describe, expect, it } from 'vitest'
import { mergeProps } from './merge-props.ts'

describe('mergeProps', () => {
	it('should merge properties correctly', () => {
		const input = [
			{ id: 1, name: 'Alice', group: 'A', value: 10 },
			{ id: 1, name: 'Alice', group: 'C', value: 20 },
			{ id: 2, name: 'Bob', group: 'B', value: 20 },
			{ id: 2, name: 'Bob', group: 'C', value: 30 },
			{ id: 3, name: 'Charlie', group: 'D', value: 30 },
			{ id: 3, name: 'Charlie', group: 'E', value: 40 }
		]

		const expectedOutput = [
			{
				children: [
					{ g: 'A', v: 10 },
					{ g: 'C', v: 20 }
				],
				id: 1,
				name: 'Alice'
			},
			{
				children: [
					{ g: 'B', v: 20 },
					{ g: 'C', v: 30 }
				],
				id: 2,
				name: 'Bob'
			},
			{
				children: [
					{ g: 'D', v: 30 },
					{ g: 'E', v: 40 }
				],
				id: 3,
				name: 'Charlie'
			}
		]

		const result = mergeProps(
			'id',
			{ group: 'g', value: 'v' } as const,
			'children',
			input
		)
		expect(result).toEqual(expectedOutput)
	})
})
