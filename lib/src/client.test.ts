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
})
