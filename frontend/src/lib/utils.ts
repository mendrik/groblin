import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function hasMethod<T extends object>(
	obj: T | null | undefined,
	methodName: string
): obj is T & { [K in typeof methodName]: (...args: any[]) => any } {
	return (
		obj != null &&
		methodName in obj &&
		typeof (obj as any)[methodName] === 'function'
	)
}
