import assert from "node:assert"
import { describe, it, mock } from "node:test"

import { eventStream } from "./eventStream.ts"

describe("eventStream", () => {
	it("enqueues values and closes the stream", async () => {
		const cleanup = mock.fn()

		const stream = eventStream(({ enqueue, close }) => {
			setImmediate(() => {
				enqueue("hello")
				enqueue("world")
				close()
			})

			return cleanup
		})

		const reader = stream.getReader()

		assert.deepStrictEqual(await reader.read(), { done: false, value: "hello" })
		assert.deepStrictEqual(await reader.read(), { done: false, value: "world" })

		assert.deepStrictEqual(await reader.read(), {
			done: true,
			value: undefined,
		})

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})

	it("errors the stream", async () => {
		const cleanup = mock.fn()

		const stream = eventStream(({ error }) => {
			setImmediate(() => {
				error(new Error("boom"))
			})

			return cleanup
		})

		const reader = stream.getReader()

		await assert.rejects(reader.read(), new Error("boom"))

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})

	it("cleans up when the stream is canceled", async () => {
		const cleanup = mock.fn()

		const stream = eventStream(() => cleanup)

		const reader = stream.getReader()

		await reader.cancel()

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})
})
