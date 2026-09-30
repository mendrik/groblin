import { type DefaultTreeAdapterTypes, parseFragment, serialize } from 'parse5'

const keyPattern = /^project_[1-9][0-9]*\/[0-9a-f-]{36}$/
export const assetPath = (key: string) => {
	if (!keyPattern.test(key)) throw new Error('Invalid article asset')
	return `/media/asset/${key}`
}
const allowed = new Set(
	'p h1 h2 h3 h4 h5 h6 strong b em i u s del sub sup a span mark div br blockquote pre code ul ol li table thead tbody tfoot tr td th colgroup col hr img'.split(
		' '
	)
)
const removed = new Set(
	'script style svg math iframe object embed template'.split(' ')
)
const safeStyle = (input: string) =>
	input
		.split(';')
		.flatMap(rule => {
			const [rawName, ...parts] = rule.split(':')
			const name = rawName.trim().toLowerCase(),
				value = parts.join(':').trim()
			if (name === 'text-align' && /^(left|right|center|justify)$/.test(value))
				return [`${name}: ${value}`]
			if (name === 'font-family' && /^[a-zA-Z0-9 ,"'-]{1,160}$/.test(value))
				return [`${name}: ${value}`]
			if (
				['color', 'background-color'].includes(name) &&
				/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,24}|(?:rgba?|hsla?)\([0-9.,%\s+-]+\))$/.test(
					value
				)
			)
				return [`${name}: ${value}`]
			return []
		})
		.join('; ')
const safeLink = (input: string) =>
	/^(https?:|mailto:|#[^\s]*$|\/(?!\/))/.test(input.trim())
		? input.trim()
		: undefined

/** Canonical safe HTML stores asset keys, never expiring storage URLs. */
export function normalizeArticle(
	input: string,
	imageUrl: (key: string) => string = assetPath,
	remap: (key: string) => string = key => key
) {
	const fragment = parseFragment(input)
	const assets = new Set<string>()
	const walk = (parent: DefaultTreeAdapterTypes.ParentNode, depth = 0) => {
		if (depth > 64) throw new Error('Article is deeper than 64 levels')
		parent.childNodes =
			parent.childNodes.flatMap<DefaultTreeAdapterTypes.ChildNode>(node => {
				if (!('tagName' in node)) return node.nodeName === '#text' ? [node] : []
				if (removed.has(node.tagName)) return []
				if (!allowed.has(node.tagName)) node.tagName = 'span'
				const attrs = new Map(node.attrs.map(attr => [attr.name, attr.value]))
				const next: typeof node.attrs = []
				if (node.tagName === 'img') {
					const sourceKey =
						attrs.get('data-groblin-asset') ??
						attrs.get('src')?.match(/^\/media\/asset\/(.+)$/)?.[1]
					if (!sourceKey || !keyPattern.test(sourceKey)) return []
					const key = remap(sourceKey)
					assetPath(key)
					assets.add(key)
					next.push(
						{ name: 'data-groblin-asset', value: key },
						{ name: 'src', value: imageUrl(key) },
						{ name: 'alt', value: (attrs.get('alt') ?? '').slice(0, 500) }
					)
				} else if (node.tagName === 'a') {
					const href = safeLink(attrs.get('href') ?? '')
					if (href)
						next.push(
							{ name: 'href', value: href },
							{ name: 'rel', value: 'noopener noreferrer' }
						)
				}
				for (const name of ['colspan', 'rowspan', 'width', 'height', 'start']) {
					const value = attrs.get(name)
					if (
						value &&
						/^[0-9]{1,4}$/.test(value) &&
						Number(value) > 0 &&
						Number(value) <= 4096
					)
						next.push({ name, value })
				}
				const style = safeStyle(attrs.get('style') ?? '')
				if (style) next.push({ name: 'style', value: style })
				if (attrs.has('data-color'))
					next.push({
						name: 'data-color',
						value: (attrs.get('data-color') ?? '').slice(0, 128)
					})
				node.attrs = next
				walk(node, depth + 1)
				return [node]
			})
	}
	walk(fragment)
	return {
		content: serialize(fragment),
		...(assets.size ? { assets: [...assets] } : {})
	}
}

export function contentAssetKeys(value: unknown) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return []
	const file =
		'file' in value && typeof value.file === 'string' ? [value.file] : []
	const assets =
		'assets' in value && Array.isArray(value.assets)
			? value.assets.filter(
					(asset): asset is string => typeof asset === 'string'
				)
			: []
	return [...new Set([...file, ...assets])]
}
