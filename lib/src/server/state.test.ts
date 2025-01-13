import assert from "node:assert"
import { describe, it } from "node:test"

import { defineState, runWithAsyncState } from "./state.ts"

describe("runWithAsyncState", () => {
	it("runs the given function and returns its result", () => {
		assert.deepStrictEqual(
			runWithAsyncState(() => "result"),
			"result",
		)
	})

	it("throws if there is a nested call", () => {
		assert.throws(() => {
			runWithAsyncState(() => {
				runWithAsyncState(noop)
			})
		}, new Error("Already running with async state."))
	})
})

describe("defineState", () => {
	describe("createState", () => {
		it("throws if called outside of a runWithAsyncState call", () => {
			const { createState } = defineState<string>()

			assert.throws(() => {
				createState("hello")
			}, new Error("Async state is not available."))
		})

		it("creates a state", () => {
			const { createState } = defineState<string>()

			const state = runWithAsyncState(() => createState("hello"))

			assert.strictEqual(state, "hello")
		})

		it("throws if the state has already been created", () => {
			const { createState } = defineState<string>()

			assert.throws(() => {
				runWithAsyncState(() => {
					createState("hello")
					createState("world")
				})
			}, new Error("State has already been created."))
		})
	})

	describe("replaceState", () => {
		it("throws if called outside of a runWithAsyncState call", () => {
			const { replaceState } = defineState<string>()

			assert.throws(() => {
				replaceState("hello")
			}, new Error("Async state is not available."))
		})

		it("replaces the state", () => {
			const { createState, replaceState } = defineState<string>()

			const state = runWithAsyncState(() => {
				createState("hello")
				return replaceState("world")
			})

			assert.strictEqual(state, "world")
		})
	})

	describe("clearState", () => {
		it("throws if called outside of a runWithAsyncState call", () => {
			const { clearState } = defineState<string>()

			assert.throws(() => {
				clearState()
			}, new Error("Async state is not available."))
		})

		it("clears the state", () => {
			const { createState, clearState } = defineState<string>()

			const state = runWithAsyncState(() => {
				createState("hello")
				clearState()
				return createState("world")
			})

			assert.strictEqual(state, "world")
		})
	})

	describe("useState", () => {
		it("throws if called outside of a runWithAsyncState call", () => {
			const { useState } = defineState<string>()

			assert.throws(() => {
				useState()
			}, new Error("Async state is not available."))
		})

		it("returns the state", () => {
			const { createState, useState } = defineState<string>()

			const state = runWithAsyncState(() => {
				createState("hello")
				return useState()
			})

			assert.strictEqual(state, "hello")
		})

		it("returns undefined if the state has not been created", () => {
			const { useState } = defineState<string>()

			const state = runWithAsyncState(() => useState())

			assert.strictEqual(state, undefined)
		})
	})

	describe("useStateOrThrow", () => {
		it("throws if called outside of a runWithAsyncState call", () => {
			const { useStateOrThrow } = defineState<string>()

			assert.throws(() => {
				useStateOrThrow()
			}, new Error("Async state is not available."))
		})

		it("returns the state", () => {
			const { createState, useStateOrThrow } = defineState<string>()

			const state = runWithAsyncState(() => {
				createState("hello")
				return useStateOrThrow()
			})

			assert.strictEqual(state, "hello")
		})

		it("throws if the state has not been created", () => {
			const { useStateOrThrow } = defineState<string>()

			assert.throws(() => {
				runWithAsyncState(() => useStateOrThrow())
			}, new Error("State has not been created."))
		})
	})
})

/* node:coverage ignore next 3 */
function noop() {
	// do nothing
}
