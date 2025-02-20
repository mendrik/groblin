import { describe, expect, test } from 'vitest'
import { url } from './url'

describe('url', () => {
	test('should return the same URL when there is no query string', () => {
		expect(url`http://example.com`).toBe('http://example.com')
	})

	test('should return the URL with valid query string intact', () => {
		expect(url`http://example.com?foo=bar&baz=qux`).toBe(
			'http://example.com?foo=bar&baz=qux'
		)
	})

	test('should remove query parameters with empty values', () => {
		// 'baz=' should be removed since the value is empty.
		expect(url`http://example.com?foo=bar&baz=`).toBe(
			'http://example.com?foo=bar'
		)
	})

	test('should remove query parameters with missing keys', () => {
		// '=value' should be removed since the key is missing.
		expect(url`http://example.com?=value&foo=bar`).toBe(
			'http://example.com?foo=bar'
		)
	})

	test('should handle query strings with interpolated values', () => {
		const fooVal = 'bar'
		const emptyVal = '' // This will be filtered out.
		expect(url`http://example.com?foo=${fooVal}&baz=${emptyVal}`).toBe(
			'http://example.com?foo=bar'
		)
	})

	test('should return only the base URL if query string is empty or malformed', () => {
		// Query marker with no parameters
		expect(url`http://example.com?`).toBe('http://example.com')
		// Only invalid parameters
		expect(url`http://example.com?&=`).toBe('http://example.com')
	})
})
