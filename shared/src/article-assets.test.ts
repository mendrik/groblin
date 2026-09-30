import { expect, test } from 'vitest'
import { assetPath, normalizeArticle } from './article-assets.ts'
import { articleValueSchema, parseContentValue } from './content.ts'
import { NodeType } from './node-types.ts'

const file = 'project_1/00000000-0000-0000-0000-000000000001'
test('article normalization retains formatting and only canonical local images with explicit assets', () => {
	const result = normalizeArticle(
		`<p style="color: #ff0000; text-align: center; background-image: url(https://tracking.invalid)">Hello<img src="${assetPath(file)}" alt="Photo"></p>`
	)
	expect(result.assets).toEqual([file])
	expect(result.content).toContain(`data-groblin-asset="${file}"`)
	expect(result.content).toContain('color: #ff0000; text-align: center')
	expect(result.content).not.toContain('background-image')
	expect(
		parseContentValue(NodeType.article, {
			content: result.content,
			assets: ['forged']
		})
	).toEqual(result)
})
test('active content, unsafe links, tracking images and event handlers are removed even with HTML entities', () => {
	const result = normalizeArticle(
		'<script>alert(1)</script><svg><script>bad</script></svg><a href="java&#115;cript:alert(1)" onclick="bad()">Click</a><img src="https://tracking.invalid/pixel"><p onmouseover="bad()">Text</p>'
	)
	expect(result.content).toBe('<a>Click</a><p>Text</p>')
})
test('archive remapping and published image URLs preserve keys independently of signed URLs', () => {
	const mapped = file.replace('project_1/', 'project_2/')
	const article = `<img src="${assetPath(file)}" alt="Photo">`
	const result = normalizeArticle(article, assetPath, () => mapped)
	expect(result.assets).toEqual([mapped])
	const publicArticle = normalizeArticle(
		result.content,
		() => 'https://cms.invalid/media/signed'
	)
	expect(publicArticle.content).toContain(
		'src="https://cms.invalid/media/signed"'
	)
	expect(normalizeArticle(publicArticle.content)).toEqual(result)
})

test('excessively nested articles return a validation error instead of throwing from safeParse', () => {
	const result = articleValueSchema.safeParse({
		content: `${'<div>'.repeat(70)}Text${'</div>'.repeat(70)}`
	})
	expect(result.success).toBe(false)
})
