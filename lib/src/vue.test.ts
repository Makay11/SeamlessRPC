import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"
import { scheduler } from "node:timers/promises"

import { computed, shallowRef } from "vue"

import type { OnData } from "./vue.ts"

const onBeforeUnmount = mock.fn<(callback: () => void) => void>()

beforeEach(() => {
	onBeforeUnmount.mock.resetCalls()
})

mock.module("vue", {
	namedExports: {
		computed,
		onBeforeUnmount,
		shallowRef,
	},
})

const { useSubscription } = await import("./vue.ts")

function noop() {
	// do nothing
}

describe("useSubscription", () => {
	it("subscribes and unsubscribes", async () => {
		const { isSubscribed, isSubscribing, subscribe, unsubscribe } =
			useSubscription({
				source: async () => Promise.resolve(new ReadableStream()),
				onData: noop,
			})

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)

		const promise = subscribe()

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, true)

		await promise

		assert.strictEqual(isSubscribed.value, true)
		assert.strictEqual(isSubscribing.value, false)

		await unsubscribe()

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)
	})

	it("throws if subscribe is called while already subscribing", async () => {
		const { isSubscribed, isSubscribing, subscribe } = useSubscription({
			source: async () => Promise.resolve(new ReadableStream()),
			onData: noop,
		})

		const promise = subscribe()

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, true)

		await assert.rejects(subscribe(), new Error("Already subscribing."))

		await promise
	})

	it("throws if subscribe is called while already subscribed", async () => {
		const { isSubscribed, isSubscribing, subscribe } = useSubscription({
			source: async () => Promise.resolve(new ReadableStream()),
			onData: noop,
		})

		await subscribe()

		assert.strictEqual(isSubscribed.value, true)
		assert.strictEqual(isSubscribing.value, false)

		await assert.rejects(subscribe(), new Error("Already subscribed."))
	})

	it("sets the flags correctly when subscribe fails", async () => {
		const { isSubscribed, isSubscribing, subscribe } = useSubscription({
			source: async () => Promise.reject(new Error("Failed to subscribe.")),
			onData: noop,
		})

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)

		const promise = subscribe()

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, true)

		await assert.rejects(promise, new Error("Failed to subscribe."))

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)
	})

	it("unsubscribes before the component is unmounted", async () => {
		assert.strictEqual(onBeforeUnmount.mock.callCount(), 0)

		const { isSubscribed, isSubscribing, subscribe } = useSubscription({
			source: async () => Promise.resolve(new ReadableStream()),
			onData: noop,
		})

		assert.strictEqual(onBeforeUnmount.mock.callCount(), 1)

		await subscribe()

		const callback = onBeforeUnmount.mock.calls[0]!.arguments[0]

		await scheduler.yield()

		assert.strictEqual(isSubscribed.value, true)
		assert.strictEqual(isSubscribing.value, false)

		callback()

		await scheduler.yield()

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)
	})

	it("calls onData with the enqueued data", async () => {
		let controller: ReadableStreamDefaultController<string>

		const stream = new ReadableStream<string>({
			start(_controller) {
				controller = _controller
			},
		})

		const onData = mock.fn<OnData<string>>()

		const { subscribe } = useSubscription({
			source: async () => Promise.resolve(stream),
			onData,
		})

		await subscribe()

		await scheduler.yield()

		assert.strictEqual(onData.mock.callCount(), 0)

		controller!.enqueue("hello")

		await scheduler.yield()

		assert.strictEqual(onData.mock.callCount(), 1)

		controller!.enqueue("world")

		await scheduler.yield()

		assert.strictEqual(onData.mock.callCount(), 2)

		assert.deepStrictEqual(
			onData.mock.calls.map((call) => call.arguments),
			[["hello"], ["world"]],
		)
	})

	it("calls onClose when the stream closes", async () => {
		let controller: ReadableStreamDefaultController<string>

		const stream = new ReadableStream<string>({
			start(_controller) {
				controller = _controller
			},
		})

		const onClose = mock.fn()

		const { subscribe } = useSubscription({
			source: async () => Promise.resolve(stream),
			onData: noop,
			onClose,
		})

		await subscribe()

		await scheduler.yield()

		assert.strictEqual(onClose.mock.callCount(), 0)

		controller!.close()

		await scheduler.yield()

		assert.strictEqual(onClose.mock.callCount(), 1)
	})

	it("calls onError when the stream errors", async () => {
		let controller: ReadableStreamDefaultController<string>

		const stream = new ReadableStream<string>({
			start(_controller) {
				controller = _controller
			},
		})

		const onError = mock.fn()

		const { subscribe } = useSubscription({
			source: async () => Promise.resolve(stream),
			onData: noop,
			onError,
		})

		await subscribe()

		await scheduler.yield()

		assert.strictEqual(onError.mock.callCount(), 0)

		controller!.error(new Error("some_error"))

		await scheduler.yield()

		assert.strictEqual(onError.mock.callCount(), 1)

		assert.deepStrictEqual(onError.mock.calls[0]!.arguments, [
			new Error("some_error"),
		])
	})

	it("defaults to console.error for onError", async (t) => {
		let controller: ReadableStreamDefaultController<string>

		const stream = new ReadableStream<string>({
			start(_controller) {
				controller = _controller
			},
		})

		const consoleError = t.mock.method(console, "error", noop)

		const { subscribe } = useSubscription({
			source: async () => Promise.resolve(stream),
			onData: noop,
		})

		await subscribe()

		await scheduler.yield()

		assert.strictEqual(consoleError.mock.callCount(), 0)

		controller!.error(new Error("some_error"))

		await scheduler.yield()

		assert.strictEqual(consoleError.mock.callCount(), 1)

		assert.deepStrictEqual(consoleError.mock.calls[0]!.arguments, [
			new Error("some_error"),
		])
	})
})
