import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"
import { setTimeout } from "node:timers/promises"

const { computed, shallowRef } = await import("vue")

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

describe("useSubscription", () => {
	it("subscribes and unsubscribes", async () => {
		const { isSubscribed, isSubscribing, subscribe, unsubscribe } =
			useSubscription({
				source: async () => Promise.resolve(new ReadableStream()),
				onData() {
					// do nothing
				},
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
			onData() {
				// do nothing
			},
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
			onData() {
				// do nothing
			},
		})

		await subscribe()

		assert.strictEqual(isSubscribed.value, true)
		assert.strictEqual(isSubscribing.value, false)

		await assert.rejects(subscribe(), new Error("Already subscribed."))
	})

	it("sets the flags correctly when subscribe fails", async () => {
		const { isSubscribed, isSubscribing, subscribe } = useSubscription({
			source: async () => Promise.reject(new Error("Failed to subscribe.")),
			onData() {
				// do nothing
			},
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
			onData() {
				// do nothing
			},
		})

		assert.strictEqual(onBeforeUnmount.mock.callCount(), 1)

		await subscribe()

		const callback = onBeforeUnmount.mock.calls[0]!.arguments[0]

		await setTimeout(100)

		assert.strictEqual(isSubscribed.value, true)
		assert.strictEqual(isSubscribing.value, false)

		callback()

		await setTimeout(100)

		assert.strictEqual(isSubscribed.value, false)
		assert.strictEqual(isSubscribing.value, false)
	})
})
