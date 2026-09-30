import { expect, test } from 'vitest'
import {
	booleanValueSchema,
	choiceValueSchema,
	colorValueSchema,
	listValueSchema,
	mediaValueSchema,
	numberValueSchema,
	parseContentValue,
	stringValueSchema
} from './content.ts'
import { parseNodeSettings } from './node-settings.ts'
import { NodeType } from './node-types.ts'

test('content shapes reject incorrectly typed editor and API payloads', () => {
	expect(stringValueSchema.safeParse({ content: 42 }).success).toBe(false)
	expect(numberValueSchema.safeParse({ figure: '42' }).success).toBe(false)
	expect(numberValueSchema.safeParse({ figure: Number.NaN }).success).toBe(
		false
	)
	expect(numberValueSchema.safeParse({ figure: Infinity }).success).toBe(false)
	expect(booleanValueSchema.safeParse({ state: 'false' }).success).toBe(false)
	expect(choiceValueSchema.safeParse({ selected: ['one'] }).success).toBe(false)
	expect(listValueSchema.safeParse({}).success).toBe(false)
	expect(stringValueSchema.parse({ content: '' })).toEqual({ content: '' })
	expect(numberValueSchema.parse({ figure: 0 })).toEqual({ figure: 0 })
	expect(booleanValueSchema.parse({ state: false })).toEqual({ state: false })
})

test('media metadata requires an object, file identity and nonnegative integral size', () => {
	const file = {
		name: 'photo.png',
		file: 'project_1/file',
		contentType: 'image/png',
		size: 2048
	}
	expect(mediaValueSchema.parse(file)).toEqual(file)
	for (const invalid of [
		null,
		{},
		{ ...file, file: '' },
		{ ...file, size: -1 },
		{ ...file, size: 1.5 },
		{ ...file, contentType: null }
	]) {
		expect(mediaValueSchema.safeParse(invalid).success).toBe(false)
	}
})

test('color channels and alpha stay within their representable ranges', () => {
	expect(colorValueSchema.parse({ rgba: [0, 128, 255] }).rgba).toEqual([
		0, 128, 255
	])
	expect(colorValueSchema.safeParse({ rgba: [0, 128, 255, 0.5] }).success).toBe(
		true
	)
	for (const rgba of [
		[-1, 0, 0],
		[256, 0, 0],
		[0, 0, 0, 2],
		[0, 0]
	]) {
		expect(colorValueSchema.safeParse({ rgba }).success).toBe(false)
	}
})

test('field constraints reject invalid dates, choice selections and numeric bounds', () => {
	expect(() =>
		parseContentValue(NodeType.date, { date: '2026-02-30' })
	).toThrow()
	expect(
		parseContentValue(NodeType.date, { date: '2026-09-30T12:34:56+03:00' })
	).toBeDefined()
	expect(() =>
		parseContentValue(
			NodeType.choice,
			{ selected: 'removed' },
			{ choices: ['current'] }
		)
	).toThrow('available choice')
	expect(
		parseContentValue(
			NodeType.choice,
			{ selected: 'current' },
			{ choices: ['current'] }
		)
	).toEqual({ selected: 'current' })
	expect(() =>
		parseContentValue(NodeType.number, { figure: 2 }, { minimum: 3 })
	).toThrow('at least')
	expect(() =>
		parseContentValue(NodeType.number, { figure: 4 }, { maximum: 3 })
	).toThrow('at most')
	expect(
		parseContentValue(
			NodeType.number,
			{ figure: 3 },
			{ minimum: 3, maximum: 3 }
		)
	).toEqual({ figure: 3 })
	expect(() =>
		parseContentValue(NodeType.string, { content: '  ' }, { required: true })
	).toThrow('required')
	expect(() => parseContentValue(NodeType.object, { content: 'text' })).toThrow(
		'Containers'
	)
	expect(() => parseContentValue(NodeType.root, {})).toThrow('Containers')
	expect(() =>
		parseContentValue(NodeType.boolean, { state: false, surprise: true })
	).toThrow()
})

test('settings reject unsafe API names, unbounded thumbnails and inconsistent limits', () => {
	for (const choices of [
		['bad name'],
		['__reserved'],
		['red', 'red'],
		['true'],
		['false'],
		['null']
	])
		expect(() => parseNodeSettings(NodeType.choice, { choices })).toThrow()
	for (const thumbnails of [
		['0'],
		['4097'],
		['1x0'],
		['4096x4097'],
		['not-a-size']
	])
		expect(() => parseNodeSettings(NodeType.media, { thumbnails })).toThrow()
	expect(
		parseNodeSettings(NodeType.media, { thumbnails: ['300', '4096x4096'] })
	).toMatchObject({ thumbnails: ['300', '4096x4096'] })
	for (const settings of [
		{ minimum: 2, maximum: 1 },
		{ precision: 1.5 },
		{ precision: 13 },
		{ precision: -1 },
		{ unknown: true }
	])
		expect(() => parseNodeSettings(NodeType.number, settings)).toThrow()
	for (const type of Object.values(NodeType))
		expect(parseNodeSettings(type, null)).toMatchObject({ required: false })
})
