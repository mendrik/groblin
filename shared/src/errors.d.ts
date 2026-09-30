export declare const throwError: (message: string) => never
export declare const throwAny: (errors: any) => never
export declare const error: unique symbol
export declare const rethrow: (
	strings: TemplateStringsArray,
	...values: (number | boolean | string | undefined | typeof error)[]
) => (err: Error) => never
