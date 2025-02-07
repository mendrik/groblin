export type StringType = { content: string }
export type NumberType = { figure: number }
type Bytes = number

export type MediaType = {
	name: string
	file: string
	contentType: string
	size: Bytes
	url?: string
}

export type DateType = { date: string | Date }
export type ColorType = { rgba: [number, number, number, number?] }
export type ChoiceType = { selected: string }
export type BooleanType = { state: boolean }
export type ArticleType = { content: string }
export type ListType = { name: string }
