export const log = (
	event: string,
	details: Record<string, string | number | boolean | undefined> = {}
) =>
	console.log(
		JSON.stringify({ time: new Date().toISOString(), event, ...details })
	)
