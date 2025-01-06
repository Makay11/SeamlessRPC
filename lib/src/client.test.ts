import assert from "node:assert"
import { beforeEach, describe, it, type Mock, mock } from "node:test"

import { rpc, RpcClientError } from "./client.ts"

declare global {
	/* eslint-disable no-var */
	var $MAKAY_RPC_URL: string
	var $MAKAY_RPC_CREDENTIALS: RequestCredentials
	var $MAKAY_RPC_SSE: boolean
	/* eslint-enable no-var */
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
	let fetch: Mock<typeof globalThis.fetch>

	beforeEach(() => {
		globalThis.$MAKAY_RPC_URL = "http://localhost:3000"
		globalThis.$MAKAY_RPC_CREDENTIALS = "include"
		globalThis.$MAKAY_RPC_SSE = false

		fetch = globalThis.fetch = mock.fn()

		fetch.mock.mockImplementation(() => {
			throw new Error("Missing response mock.")
		})
	})

	function mockResponse(response: Response) {
		fetch.mock.mockImplementationOnce(async () => Promise.resolve(response))
	}

	it("sends a POST request", async () => {
		globalThis.$MAKAY_RPC_URL = "http://localhost:1234"
		globalThis.$MAKAY_RPC_CREDENTIALS = "same-origin"

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

		assert.deepStrictEqual(await execute(), {
			hello: "world",
		})
	})

	it("throws if the response is an event stream but SSE support is not enabled", async () => {
		globalThis.$MAKAY_RPC_SSE = false

		mockResponse(
			new Response(null, {
				status: 200,
				headers: { "content-type": "text/event-stream" },
			}),
		)

		const execute = rpc("foo/bar/baz")

		await assert.rejects(execute(), new Error("SSE support is not enabled."))
	})
})
