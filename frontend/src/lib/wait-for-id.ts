export const waitForId = (id: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const observer = new MutationObserver(() => {
			const node = document.getElementById(id)
			if (node) {
				observer.disconnect()
				resolve(id)
			}
		})

		observer.observe(document.body, {
			childList: true,
			subtree: true
		})

		const timeout = setTimeout(() => {
			observer.disconnect()
			reject(new Error(`ID ${id} not found within timeout`))
		}, 1000) // 1 second timeout

		const cleanup = () => {
			observer.disconnect()
			clearTimeout(timeout)
		}

		observer.observe(document.body, {
			childList: true,
			subtree: true
		})
	})
}
