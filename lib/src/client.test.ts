import assert from "node:assert"
import { beforeEach, describe, it, type Mock, mock } from "node:test"

import type { EventSourceMessage } from "eventsource-parser/stream"

import { rpc, RpcClientError } from "./client.ts"

declare global {
	var $SEAMLESSRPC_URL: string
	var $SEAMLESSRPC_CREDENTIALS: RequestCredentials
	var $SEAMLESSRPC_SSE: boolean

	var window: Window & typeof globalThis
}

describe("RpcClientError", () => {
	it("extends Error", () => {
		assert(
			new RpcClientError(new Response(null, { status: 500 })) instanceof Error,
		)
	})

	it("sets the message to the response status text", () => {
		const response = new Response(null, {
			status: 500,
			statusText: "Internal Server Error",
		})

		assert.strictEqual(
			new RpcClientError(response).message,
			"Internal Server Error",
		)
	})

	it("exposes the response", () => {
		const response = new Response(null, { status: 500 })

		assert.strictEqual(new RpcClientError(response).response, response)
	})
})

describe("rpc", () => {
	let window: typeof globalThis.window

	let fetch: Mock<typeof globalThis.fetch>

	beforeEach(() => {
		globalThis.$SEAMLESSRPC_URL = "http://localhost:3000"
		globalThis.$SEAMLESSRPC_CREDENTIALS = "include"
		globalThis.$SEAMLESSRPC_SSE = false

		window = globalThis.window = {} as typeof globalThis.window

		fetch = globalThis.fetch = mock.fn(
			/* node:coverage ignore next 3 */
			() => {
				throw new Error("Missing mock implementation.")
			},
		)
	})

	function mockResponse(response: Response) {
		fetch.mock.mockImplementationOnce(async () => Promise.resolve(response))
	}

	it("sends a POST request", async () => {
		globalThis.$SEAMLESSRPC_URL = "http://localhost:1234"
		globalThis.$SEAMLESSRPC_CREDENTIALS = "same-origin"

		mockResponse(new Response(JSON.stringify("hello world!")))

		const execute = rpc("foo/bar/baz")

		const result = await execute("hello", "world")

		assert.deepStrictEqual(result, "hello world!")

		assert.strictEqual(fetch.mock.callCount(), 1)

		const [url, rawOptions] = fetch.mock.calls[0]!.arguments

		assert.strictEqual(url, "http://localhost:1234/foo/bar/baz")

		assert(rawOptions != null)

		const { signal, ...options } = rawOptions

		assert.deepStrictEqual(options, {
			method: "POST",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(["hello", "world"]),
		})

		assert(signal != null)
	})

	it("throws if the response is not ok", async () => {
		mockResponse(new Response(null, { status: 500 }))

		const execute = rpc("foo/bar/baz")

		await assert.rejects(
			execute(),
			new RpcClientError(new Response(null, { status: 500 })),
		)
	})

	it("returns undefined if the response is 204", async () => {
		mockResponse(new Response(null, { status: 204 }))

		const execute = rpc("foo/bar/baz")

		assert.strictEqual(await execute(), undefined)
	})

	it("returns the parsed JSON response body if the response is not an event stream", async () => {
		mockResponse(new Response(JSON.stringify({ hello: "world" })))

		const execute = rpc("foo/bar/baz")

		assert.deepStrictEqual(await execute(), { hello: "world" })
	})

	describe("SSE", () => {
		let addEventListener: Mock<typeof window.addEventListener>
		let removeEventListener: Mock<typeof window.removeEventListener>

		let responseStreamController: ReadableStreamController<Uint8Array>

		let _execute: ReturnType<typeof rpc>

		beforeEach(() => {
			globalThis.$SEAMLESSRPC_SSE = true

			addEventListener = window.addEventListener = mock.fn()
			removeEventListener = window.removeEventListener = mock.fn()

			mockResponse(
				new Response(
					new ReadableStream({
						start(controller) {
							responseStreamController = controller
						},
					}),
					{
						status: 200,
						headers: { "content-type": "text/event-stream" },
					},
				),
			)

			_execute = rpc("foo/bar/baz")
		})

		async function execute() {
			const stream = await _execute()

			assert(stream instanceof ReadableStream)

			return stream
		}

		function getSignal() {
			return fetch.mock.calls[0]!.arguments[1]!.signal!
		}

		const encoder = new TextEncoder()

		function enqueueMessage({ event, data }: EventSourceMessage) {
			responseStreamController.enqueue(
				encoder.encode(
					event == null
						? `data:${JSON.stringify(data)}\n\n`
						: `event:${event}\ndata:${JSON.stringify(data)}\n\n`,
				),
			)
		}

		it("throws if the response is an event stream but SSE support is not enabled", async () => {
			globalThis.$SEAMLESSRPC_SSE = false

			await assert.rejects(execute(), new Error("SSE support is not enabled."))
		})

		it("aborts the request on beforeunload", async () => {
			assert.strictEqual(addEventListener.mock.callCount(), 0)

			await execute()

			assert.strictEqual(addEventListener.mock.callCount(), 1)

			const [addedEvent, addedListener] =
				addEventListener.mock.calls[0]!.arguments

			assert.strictEqual(addedEvent, "beforeunload")
			assert(addedListener instanceof Function)

			const signal = getSignal()

			assert.strictEqual(signal.aborted, false)

			addedListener(new Event("fake_event"))

			assert.strictEqual(signal.aborted, true)
		})

		it("aborts the request when the stream is cancelled", async () => {
			const stream = await execute()

			const signal = getSignal()

			assert.strictEqual(signal.aborted, false)

			await stream.cancel()

			assert.strictEqual(signal.aborted, true)
		})

		it("removes the beforeunload event listener when the stream is cancelled", async () => {
			const stream = await execute()

			const [, addedListener] = addEventListener.mock.calls[0]!.arguments

			assert.strictEqual(removeEventListener.mock.callCount(), 0)

			await stream.cancel()

			assert.strictEqual(removeEventListener.mock.callCount(), 1)

			const [removedEvent, removedListener] =
				removeEventListener.mock.calls[0]!.arguments

			assert.strictEqual(removedEvent, "beforeunload")
			assert.strictEqual(addedListener, removedListener)
		})

		it("streams the events received from the server", async () => {
			const stream = await execute()

			const reader = stream.getReader()

			enqueueMessage({ data: "hello" })
			enqueueMessage({ data: "world" })

			assert.deepStrictEqual(await reader.read(), {
				done: false,
				value: "hello",
			})
			assert.deepStrictEqual(await reader.read(), {
				done: false,
				value: "world",
			})
		})

		it("filters out the connected event", async () => {
			const stream = await execute()

			const reader = stream.getReader()

			enqueueMessage({ event: "connected", data: "" })
			enqueueMessage({ data: "hello" })

			assert.deepStrictEqual(await reader.read(), {
				done: false,
				value: "hello",
			})
		})

		it("closes the stream when the server closes the event stream", async () => {
			const stream = await execute()

			const reader = stream.getReader()

			responseStreamController.close()

			assert.deepStrictEqual(await reader.read(), {
				done: true,
				value: undefined,
			})
		})

		it("errors the stream when the server sends an error event", async () => {
			const stream = await execute()

			const reader = stream.getReader()

			enqueueMessage({ event: "error", data: "Something went wrong." })

			await assert.rejects(reader.read(), new Error('"Something went wrong."'))
		})

		it("errors the stream when the response stream errors", async () => {
			const stream = await execute()

			const reader = stream.getReader()

			responseStreamController.error(new Error("Something went wrong."))

			await assert.rejects(reader.read(), new Error("Something went wrong."))
		})
	})
})
