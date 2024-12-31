import { EventSourceParserStream } from "eventsource-parser/stream"
import type { JsonValue } from "type-fest"

import type { Controller } from "./shared/eventStream.js"
import { eventStream } from "./shared/eventStream.js"

declare const __MAKAY_RPC_SSE__: boolean

export type Config = {
	url: string
	credentials: RequestCredentials
}

export const config: Config = {
	url: "/rpc",
	credentials: "same-origin",
}

export class RpcClientError extends Error {
	public response

	constructor(response: Response) {
		super(response.statusText)
		this.response = response
	}
}

export function rpc(procedureId: string) {
	return async (...args: Array<JsonValue>) => {
		const response = await fetch(`${config.url}/${procedureId}`, {
			method: "POST",
			credentials: config.credentials,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(args),
		})

		if (!response.ok) {
			throw new RpcClientError(response)
		}

		if (response.status === 204) {
			return
		}

		if (response.headers.get("Content-Type") === "text/event-stream") {
			if (!__MAKAY_RPC_SSE__) {
				throw new Error("SSE support is not enabled.")
			}

			return eventStream(({ enqueue }) => {
				streamEvents(response.body, enqueue).catch(console.error)

				// 	.catch((error: unknown) => {
				// 		if (error instanceof DOMException && error.name === "AbortError")
				// 			return

				// 		console.error(error)
				// 	})

				function abort() {
					// abortController.abort()
				}

				window.addEventListener("beforeunload", abort)

				return () => {
					// abortController.abort()
					window.removeEventListener("beforeunload", abort)
				}
			})
		}

		return response.json() as Promise<JsonValue>
	}
}

async function streamEvents(
	body: Response["body"],
	enqueue: Controller<JsonValue>["enqueue"],
) {
	const stream = body!
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(new EventSourceParserStream())

	const reader = stream.getReader()

	try {
		for (;;) {
			const { done, value } = await reader.read()

			if (done) break

			if (value.event === "connected") continue

			enqueue(JSON.parse(value.data) as JsonValue)
		}
	} catch (e) {
		console.error(e)
	} finally {
		reader.releaseLock()
	}
}
