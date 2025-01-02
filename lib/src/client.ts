import { EventSourceParserStream } from "eventsource-parser/stream"
import type { JsonValue } from "type-fest"

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
		const abortController = new AbortController()

		const response = await fetch(`${config.url}/${procedureId}`, {
			method: "POST",
			credentials: config.credentials,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(args),
			signal: abortController.signal,
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

			function abort() {
				abortController.abort()
			}

			window.addEventListener("beforeunload", abort)

			return eventStream(({ enqueue, close, error }) => {
				response
					.body!.pipeThrough(new TextDecoderStream())
					.pipeThrough(new EventSourceParserStream())
					.pipeTo(
						new WritableStream({
							write(message) {
								if (message.event === "connected") return

								if (message.event === "error") {
									error(new Error(message.data))
									return
								}

								enqueue(JSON.parse(message.data) as JsonValue)
							},
							close,
						}),
					)
					.catch((e: unknown) => {
						if (e instanceof DOMException && e.name === "AbortError") return

						error(e as Error)
					})

				return () => {
					abort()
					window.removeEventListener("beforeunload", abort)
				}
			})
		}

		return response.json() as Promise<JsonValue>
	}
}
