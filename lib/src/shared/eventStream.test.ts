import assert from "node:assert"
import { describe, it } from "node:test"

import { eventStream } from "./eventStream.ts"

describe("eventStream", () => {
	it("enqueues values and closes the stream", async (t) => {
		const stream = eventStream(({ enqueue, close }) => {
			setTimeout(() => {
				enqueue("hello")
				enqueue("world")
				close()
			}, 0)

			return () => {
				// noop
			}
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
	})

	it("errors the stream", async (t) => {
		const stream = eventStream(({ error }) => {
			setTimeout(() => {
				error(new Error("boom"))
			}, 0)

			return () => {
				// noop
			}
		})

		const reader = stream.getReader()

		t.after(() => {
			reader.releaseLock()
		})

		await assert.rejects(reader.read(), new Error("boom"))
	})
})
