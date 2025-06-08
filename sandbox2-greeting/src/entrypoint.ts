import { greetingTerminal } from "./greeting.rpc.js"

;(async () => {
	try {
		await greetingTerminal("Hi!")
		document.body.append(
			`Check your terminal (where server is launched) 🎯; Expected the "x.x.x: Hi!" text`
		)
	} catch {
		document.body.append("Is server launched? (pnpm run dev:server)")
	}
})()
