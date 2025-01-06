import assert from "node:assert"
import { describe, it, mock } from "node:test"

import { eventStream } from "./eventStream.ts"

describe("eventStream", () => {
	it("enqueues values and closes the stream", async (t) => {
		const cleanup = mock.fn()

		const stream = eventStream(({ enqueue, close }) => {
			setTimeout(() => {
				enqueue("hello")
				enqueue("world")
				close()
			}, 0)

			return cleanup
		})

		const reader = stream.getReader()

		t.after(() => {
			reader.releaseLock()
		})

		assert.deepStrictEqual(await reader.read(), { done: false, value: "hello" })
		assert.deepStrictEqual(await reader.read(), { done: false, value: "world" })

		assert.deepStrictEqual(await reader.read(), {
			done: true,
			value: undefined,
		})

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})

	it("errors the stream", async (t) => {
		const cleanup = mock.fn()

		const stream = eventStream(({ error }) => {
			setTimeout(() => {
				error(new Error("boom"))
			}, 0)

			return cleanup
		})

		const reader = stream.getReader()

		t.after(() => {
			reader.releaseLock()
		})

		await assert.rejects(reader.read(), new Error("boom"))

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})

	it("cleans up when the stream is canceled", async (t) => {
		const cleanup = mock.fn()

		const stream = eventStream(({ close }) => {
			setTimeout(() => {
				close()
			}, 0)

			return cleanup
		})

		const reader = stream.getReader()

		t.after(() => {
			reader.releaseLock()
		})

		await reader.cancel()

		assert.strictEqual(cleanup.mock.callCount(), 1)
	})
})
