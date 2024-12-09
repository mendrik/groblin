import { NodeType } from 'src/enums.ts'
import { describe, expect, it } from 'vitest'
import { type Node, Signal, compareStructure } from './json.ts'

describe('compareStructure', () => {
	const createNode = (type: NodeType, name: string, nodes: Node[] = []): Node =>
		({
			type,
			name,
			nodes
		}) as Node

	it('should detect differences in primitive arrays', () => {
		const node = createNode(NodeType.list, 'root')
		const json = [1, 2, 3]

		const differences = Array.from(compareStructure(node, json, ''))

		expect(differences).toEqual([
			{
				key: 'data',
				parent: node,
				type: NodeType.number,
				signal: Signal.MISSING
			}
		])
	})

	it('should respect data node in primitive arrays', () => {
		const node = createNode(NodeType.list, 'root', [
			createNode(NodeType.number, 'renamed')
		]) as Node
		const json = [1, 2, 3]

		const differences = Array.from(compareStructure(node, json, ''))

		expect(differences).toEqual([])
	})

	it('should detect differences in object arrays', () => {
		const node = createNode(NodeType.list, 'root', [
			createNode(NodeType.string, 'name'),
			createNode(NodeType.number, 'age')
		])
		const json = [
			{ name: 'Alice', age: 30 },
			{ name: 'Bob', age: 25 }
		]

		const differences = Array.from(compareStructure(node, json, ''))

		expect(differences).toEqual([])
	})

	it('should detect differences in nested objects', () => {
		const node = createNode(NodeType.object, 'root', [
			createNode(NodeType.object, 'address', [
				createNode(NodeType.string, 'city'),
				createNode(NodeType.string, 'country')
			])
		])
		const json = { address: { city: 'New York', country: 'USA' } }

		const differences = Array.from(compareStructure(node, json, ''))

		expect(differences).toEqual([])
	})

	it('should detect differences in nested arrays of objects', () => {
		const node = createNode(NodeType.list, 'root', [
			createNode(NodeType.string, 'name'),
			createNode(NodeType.number, 'quantity')
		])
		const json = [
			{ name: 'Apple', quantity: 10 },
			{ name: 'Banana', quantity: 5 }
		]

		const differences = Array.from(compareStructure(node, json, ''))
		expect(differences).toEqual([])
	})

	it('should detect differences in color strings', () => {
		const node = createNode(NodeType.object, 'root', [])
		const json = { color: '#FFFFFF' }

		const differences = Array.from(compareStructure(node, json, 'color'))

		expect(differences).toEqual([
			{
				key: 'color',
				parent: node,
				type: NodeType.color,
				signal: Signal.MISSING
			}
		])
	})

	it('should detect differences in date strings', () => {
		const node = createNode(NodeType.object, 'root', [])
		const json = { date: '2024-12-09T14:13:02.764Z' }

		const differences = Array.from(compareStructure(node, json, 'date'))

		expect(differences).toEqual([
			{ key: 'date', parent: node, type: NodeType.date, signal: Signal.MISSING }
		])
	})
})
