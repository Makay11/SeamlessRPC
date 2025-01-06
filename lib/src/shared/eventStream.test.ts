import assert from "node:assert"
import { describe, it } from "node:test"

import { eventStream } from "./eventStream.ts"

describe("eventStream", () => {
	it("enqueues values and closes the stream", async () => {
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

		assert.deepStrictEqual(await reader.read(), { done: false, value: "hello" })
		assert.deepStrictEqual(await reader.read(), { done: false, value: "world" })
		assert.deepStrictEqual(await reader.read(), {
			done: true,
			value: undefined,
		})

		reader.releaseLock()
	})

	it("errors the stream", async () => {
		const stream = eventStream(({ error }) => {
			setTimeout(() => {
				error(new Error("boom"))
			}, 0)

			return () => {
				// noop
			}
		})

		const reader = stream.getReader()

		await assert.rejects(reader.read())

		reader.releaseLock()
	})
})
