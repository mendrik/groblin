import { buildSchema, parse, validate } from 'graphql'
import { afterEach, expect, test, vi } from 'vitest'
import { signMedia, verifyMedia } from './media-token.ts'
import { queryLimits } from './query-limits.ts'

afterEach(() => vi.unstubAllEnvs())
test('media capability is bound to the record, revision, size and expiry', () => {
	vi.stubEnv(
		'MEDIA_SIGNING_SECRET',
		'synthetic-test-secret-with-at-least-32-characters'
	)
	const expires = String(Date.now() + 10000)
	const token = signMedia(1, 'version', '640', expires)
	expect(verifyMedia(1, 'version', '640', expires, token)).toBe(true)
	expect(verifyMedia(2, 'version', '640', expires, token)).toBe(false)
	expect(verifyMedia(1, 'changed', '640', expires, token)).toBe(false)
	expect(verifyMedia(1, 'version', '', expires, token)).toBe(false)
	expect(verifyMedia(1, 'version', '640', '0', token)).toBe(false)
	expect(verifyMedia(1, 'version', '640', expires, 'malformed')).toBe(false)
})
test('query limits count aliases and fragment expansion', () => {
	const schema = buildSchema(
		'type Query { item: Item } type Item { value: String child: Item }'
	)
	const check = (query: string) => validate(schema, parse(query), [queryLimits])
	expect(check('{ item { value } }')).toHaveLength(0)
	expect(
		check(`{ item { ${'child {'.repeat(13)} value ${'}'.repeat(13)} } }`)
	).toHaveLength(1)
	expect(
		check(
			`{ ${Array.from({ length: 201 }, (_, i) => `x${i}: item { value }`).join(' ')} }`
		)
	).toHaveLength(1)
	expect(
		check(
			`{ item { ${'...Fields '.repeat(101)} } } fragment Fields on Item { value child { value } }`
		)
	).toHaveLength(1)
})

test.each(['', 'short'])(
	'media signing fails closed with an invalid secret (%#)',
	secret => {
		vi.stubEnv('MEDIA_SIGNING_SECRET', secret)
		expect(() => signMedia(1, 'revision', '', '9999999999999')).toThrow(
			'MEDIA_SIGNING_SECRET'
		)
	}
)

test.each(['', '-1', 'Infinity', 'NaN', '1e15', '9999999999999x'])(
	'malformed media expiry is rejected (%s)',
	expires => {
		expect(verifyMedia(1, 'revision', '', expires, 'a'.repeat(64))).toBe(false)
	}
)

test('query limits allow their exact depth and field boundaries', () => {
	const schema = buildSchema('type Query { value: String child: Query }')
	const check = (query: string) => validate(schema, parse(query), [queryLimits])
	expect(check(`{ ${'child {'.repeat(11)} value ${'}'.repeat(11)} }`)).toEqual(
		[]
	)
	expect(
		check(`{ ${'child {'.repeat(12)} value ${'}'.repeat(12)} }`)
	).toHaveLength(1)
	const fields = (count: number) =>
		`{ ${Array.from({ length: count }, (_, i) => `v${i}: value`).join(' ')} }`
	expect(check(fields(200))).toEqual([])
	expect(check(fields(201))).toHaveLength(1)
})

test('cyclic fragments terminate validation and fail closed', () => {
	const schema = buildSchema('type Query { value: String }')
	const result = validate(
		schema,
		parse('{ ...A } fragment A on Query { ...B } fragment B on Query { ...A }'),
		[queryLimits]
	)
	expect(result).toHaveLength(1)
	expect(result[0].message).toContain('Query exceeds')
})
