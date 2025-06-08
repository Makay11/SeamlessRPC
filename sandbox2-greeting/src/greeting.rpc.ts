export async function greetingTerminal(message: string) {
	const {
		default: { version },
	} = await import("node:process")
	console.info(`${version}: ${message}`)
}
